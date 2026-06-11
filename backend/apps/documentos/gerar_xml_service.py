import os
import copy
import random
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from lxml import etree
from signxml import XMLSigner, methods
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives.serialization import (
    Encoding, PrivateFormat, NoEncryption
)


NS = 'http://www.portalfiscal.inf.br/nfe'
NS_MAP = {'nfe': NS}


def _set(parent, tag, text):
    el = etree.SubElement(parent, f'{{{NS}}}{tag}')
    el.text = str(text) if text is not None else ''
    return el


def _calc_dv(chave_43):
    peso = 2
    soma = 0
    for c in reversed(chave_43):
        soma += int(c) * peso
        peso = 2 if peso == 9 else peso + 1
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def _carregar_certificado(empresa):
    """
    Carrega o certificado PFX da empresa e retorna (private_key_pem, cert_pem).
    """
    from apps.empresas.crypto import descriptografar_senha

    if not empresa.certificado_pfx or not empresa.certificado_senha:
        raise ValueError('Empresa não possui certificado digital cadastrado.')

    caminho_pfx = empresa.certificado_pfx.path
    if not os.path.exists(caminho_pfx):
        raise ValueError('Arquivo do certificado não encontrado no disco.')

    senha_str = descriptografar_senha(bytes(empresa.certificado_senha))
    senha_bytes = senha_str.encode('utf-8')

    with open(caminho_pfx, 'rb') as f:
        pfx_bytes = f.read()

    private_key, certificate, _ = pkcs12.load_key_and_certificates(
        pfx_bytes, senha_bytes
    )

    private_key_pem = private_key.private_bytes(
        Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
    )
    cert_pem = certificate.public_bytes(Encoding.PEM)

    return private_key_pem, cert_pem


def _assinar_xml(xml_bytes, private_key_pem, cert_pem):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.x509 import load_pem_x509_certificate
    import base64
    import hashlib

    root = etree.fromstring(xml_bytes)
    NS_SIG = 'http://www.w3.org/2000/09/xmldsig#'

    # Se o root for nfeProc, pega o NFe dentro
    if root.tag == f'{{{NS}}}nfeProc':
        nfe_el = root.find(f'{{{NS}}}NFe')
    else:
        nfe_el = root

    inf_nfe = nfe_el.find(f'{{{NS}}}infNFe')
    if inf_nfe is None:
        raise ValueError('infNFe não encontrado no XML para assinar.')

    ref_uri = inf_nfe.get('Id')
    print(f"[ASSINAR] ref_uri encontrado: {ref_uri}")

    # Canonicaliza o infNFe
    inf_nfe_c14n = etree.tostring(inf_nfe, method='c14n', exclusive=False, with_comments=False)

    # DigestValue
    digest = hashlib.sha1(inf_nfe_c14n).digest()
    digest_b64 = base64.b64encode(digest).decode()

    # Monta SignedInfo
    signed_info_xml = f'''<SignedInfo xmlns="{NS_SIG}">
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#{ref_uri}">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<DigestValue>{digest_b64}</DigestValue>
</Reference>
</SignedInfo>'''

    signed_info_el = etree.fromstring(signed_info_xml.encode())
    signed_info_c14n = etree.tostring(signed_info_el, method='c14n', exclusive=False, with_comments=False)

    # Assina
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    signature_bytes = private_key.sign(signed_info_c14n, padding.PKCS1v15(), hashes.SHA1())
    signature_b64 = base64.b64encode(signature_bytes).decode()

    # Certificado
    cert = load_pem_x509_certificate(cert_pem)
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    cert_b64 = base64.b64encode(cert_der).decode()

    # Monta bloco Signature e anexa no NFe (não no nfeProc)
    signature_xml = f'''<Signature xmlns="{NS_SIG}">
{signed_info_xml}
<SignatureValue>{signature_b64}</SignatureValue>
<KeyInfo>
<X509Data>
<X509Certificate>{cert_b64}</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>'''

    sig_el = etree.fromstring(signature_xml.encode())
    nfe_el.append(sig_el)  # ← anexa no NFe, não no root

    return etree.tostring(
        root,
        xml_declaration=True,
        encoding='UTF-8',
        pretty_print=False,
    )

def _adicionar_protocolo(xml_bytes, chave, protocolo, data_emissao, ver_aplic='NFCe_v4.00'):
    NS_NFE = 'http://www.portalfiscal.inf.br/nfe'
    
    # Registra o namespace para evitar ns0
    etree.register_namespace = lambda *a: None  # lxml não usa register_namespace
    nsmap = {None: NS_NFE}  # namespace padrão sem prefixo

    nfe_root = etree.fromstring(xml_bytes)

    if nfe_root.tag == f'{{{NS_NFE}}}nfeProc':
        nfe_el = nfe_root.find(f'{{{NS_NFE}}}NFe')
    else:
        nfe_el = nfe_root

    if isinstance(data_emissao, str):
        from datetime import datetime as dt
        data_emissao = dt.strptime(data_emissao, '%Y-%m-%d').date()

    data_str = f"{data_emissao.isoformat()}T00:00:00-03:00"

    nfe_proc = etree.Element(f'{{{NS_NFE}}}nfeProc', attrib={'versao': '4.00'}, nsmap=nsmap)
    nfe_proc.append(nfe_el)

    prot_nfe = etree.SubElement(nfe_proc, f'{{{NS_NFE}}}protNFe', attrib={'versao': '4.00'})
    inf_prot = etree.SubElement(prot_nfe, f'{{{NS_NFE}}}infProt')

    etree.SubElement(inf_prot, f'{{{NS_NFE}}}tpAmb').text = '1'
    etree.SubElement(inf_prot, f'{{{NS}}}verAplic').text = ver_aplic
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}chNFe').text = chave
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}dhRecbto').text = data_str
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}nProt').text = str(protocolo)
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}digVal').text = ''
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}cStat').text = '100'
    etree.SubElement(inf_prot, f'{{{NS_NFE}}}xMotivo').text = 'Autorizado o uso da NF-e'

    return etree.tostring(
        nfe_proc,
        xml_declaration=True,
        encoding='UTF-8',
        pretty_print=False,
    )


def gerar_xml_nota(empresa, numero_nota, serie, valor_total_sefaz, data_emissao, chave_acesso=None, protocolo=None, natureza_operacao=None):
    """
    Reconstrói e assina um XML de NF-e usando:
    - XML mais recente da empresa como modelo (estrutura, emitente, destinatário)
    - Itens da tabela ItemDocumento com rateio proporcional para fechar valor_total_sefaz
    - Certificado A1 da empresa para assinatura digital

    Retorna (xml_bytes: bytes, chave_acesso: str)
    """
    from apps.documentos.models import Documento, ItemDocumento

    # ── 1. XML modelo ────────────────────────────────────────────────────────
    modelo_doc = (
        Documento.objects
        .filter(empresa=empresa, tipo__in=['NFe', 'NFCe'])
        .order_by('-data_emissao', '-id')
        .first()
    )
    if not modelo_doc:
        raise ValueError('Nenhum XML encontrado para usar como modelo.')

    caminho = os.path.join('media', modelo_doc.caminho_arquivo)
    if not os.path.exists(caminho):
        raise ValueError('Arquivo XML modelo não encontrado no disco.')

    # Usa lxml para parsear (necessário para signxml)
    tree = etree.parse(caminho)
    root = copy.deepcopy(tree.getroot())

    # ── 2. Itens de referência (mais recentes, sem duplicar descrição) ───────
    import random as _random

    itens_ref = list(
        ItemDocumento.objects
        .filter(empresa=empresa)
        .order_by('-id')
        .values(
            'descricao', 'ncm', 'cest', 'cfop',
            'cst_icms', 'cst_pis', 'cst_cofins',
            'quantidade', 'valor_unitario', 'valor_total',
        )[:40]
    )
    if not itens_ref:
        raise ValueError('Nenhum item encontrado para esta empresa.')

    vistos = set()
    itens_unicos = []
    for it in itens_ref:
        if it['descricao'] not in vistos:
            vistos.add(it['descricao'])
            itens_unicos.append(it)
    
    # Limita a no máximo 5, mínimo 1
    max_itens = _random.randint(1, 5)
    itens_unicos = itens_unicos[:max_itens]

    # ── 3. Rateio proporcional ───────────────────────────────────────────────
    valor_total = Decimal(str(valor_total_sefaz))
    soma_ref = sum(Decimal(str(it['valor_total'] or 1)) for it in itens_unicos)
    if soma_ref == 0:
        soma_ref = Decimal(len(itens_unicos))
        for it in itens_unicos:
            it['valor_total'] = Decimal('1')

    itens_rateados = []
    soma_acumulada = Decimal('0')

    for i, it in enumerate(itens_unicos):
        proporcao = Decimal(str(it['valor_total'] or 1)) / soma_ref
        if i < len(itens_unicos) - 1:
            val = (valor_total * proporcao).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            val = (valor_total - soma_acumulada).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        qtd = Decimal(str(it['quantidade'] or '1.0000'))
        if qtd == 0:
            qtd = Decimal('1.0000')

        v_unit = (val / qtd).quantize(Decimal('0.0000001'), rounding=ROUND_HALF_UP)
        soma_acumulada += val
        itens_rateados.append({**it, 'val': val, 'v_unit': v_unit, 'qtd': qtd})

    # ── 4. Atualiza campos de identificação ──────────────────────────────────
    if isinstance(data_emissao, str):
        data_emissao = datetime.strptime(data_emissao, '%Y-%m-%d').date()

    def _upd(path, text):
        el = root.find(path, NS_MAP)
        if el is not None:
            el.text = text
    
    # Usa chave real da planilha
    chave = ''.join(filter(str.isdigit, chave_acesso or ''))
    if len(chave) != 44:
        raise ValueError('Chave de acesso inválida ou ausente.')

    c_nf = chave[35:43]

    _upd('.//nfe:ide/nfe:nNF', str(numero_nota))
    _upd('.//nfe:ide/nfe:serie', str(serie))
    _upd('.//nfe:ide/nfe:mod', '65')  # sempre NFC-e
    _upd('.//nfe:ide/nfe:dhEmi', f"{data_emissao.isoformat()}T00:00:00-03:00")
    _upd('.//nfe:ide/nfe:cNF', c_nf)
    _upd('.//nfe:ide/nfe:cDV', chave[-1])

    if natureza_operacao:
        _upd('.//nfe:ide/nfe:natOp', natureza_operacao)

    dhsaient = root.find('.//nfe:ide/nfe:dhSaiEnt', NS_MAP)
    if dhsaient is not None:
        dhsaient.text = f"{data_emissao.isoformat()}T00:00:00-03:00"

    # ── 5. Substitui itens (det) ─────────────────────────────────────────────
    inf_nfe_el = root.find(f'.//{{{NS}}}infNFe')

    for det in inf_nfe_el.findall(f'{{{NS}}}det'):
        inf_nfe_el.remove(det)

    total_el = inf_nfe_el.find(f'{{{NS}}}total')
    total_idx = list(inf_nfe_el).index(total_el) if total_el is not None else len(list(inf_nfe_el))

    for idx, it in enumerate(itens_rateados, start=1):
        det = etree.Element(f'{{{NS}}}det', attrib={'nItem': str(idx)})

        # Calcula vOutro (10% do valor, arredondado)

        prod = etree.SubElement(det, f'{{{NS}}}prod')
        _set(prod, 'cProd', str(idx).zfill(6))
        _set(prod, 'cEAN', 'SEM GTIN')
        _set(prod, 'xProd', it['descricao'] or 'PRODUTO')
        _set(prod, 'NCM', it['ncm'] or '00000000')
        if it.get('cest'):
            _set(prod, 'CEST', it['cest'])
        _set(prod, 'CFOP', it['cfop'] or '5102')
        _set(prod, 'uCom', 'UND')
        _set(prod, 'qCom', f"{it['qtd']:.4f}")
        _set(prod, 'vUnCom', f"{it['v_unit']:.10f}")
        _set(prod, 'vProd', f"{it['val']:.2f}")
        _set(prod, 'cEANTrib', 'SEM GTIN')
        _set(prod, 'uTrib', 'UND')
        _set(prod, 'qTrib', f"{it['qtd']:.4f}")
        _set(prod, 'vUnTrib', f"{it['v_unit']:.10f}")
        _set(prod, 'indTot', '1')

        imposto = etree.SubElement(det, f'{{{NS}}}imposto')
        _set(imposto, 'vTotTrib', '0.00')

        # ICMS
        icms_wrap = etree.SubElement(imposto, f'{{{NS}}}ICMS')
        cst_icms = str(it.get('cst_icms') or '102')
        if len(cst_icms) == 3:  # CSOSN (Simples Nacional)
            icms_tipo = etree.SubElement(icms_wrap, f'{{{NS}}}ICMSSN{cst_icms}')
            _set(icms_tipo, 'orig', '0')
            _set(icms_tipo, 'CSOSN', cst_icms)
        else:
            icms_tipo = etree.SubElement(icms_wrap, f'{{{NS}}}ICMS00')
            _set(icms_tipo, 'orig', '0')
            _set(icms_tipo, 'CST', cst_icms.zfill(2))
            _set(icms_tipo, 'modBC', '3')
            _set(icms_tipo, 'vBC', f"{it['val']:.2f}")
            _set(icms_tipo, 'pICMS', '0.00')
            _set(icms_tipo, 'vICMS', '0.00')

        # PIS
        pis_wrap = etree.SubElement(imposto, f'{{{NS}}}PIS')
        cst_pis = str(it.get('cst_pis') or '07')
        if cst_pis in ('07', '08', '09'):
            pis_tipo = etree.SubElement(pis_wrap, f'{{{NS}}}PISNT')
            _set(pis_tipo, 'CST', cst_pis)
        else:
            pis_tipo = etree.SubElement(pis_wrap, f'{{{NS}}}PISAliq')
            _set(pis_tipo, 'CST', cst_pis.zfill(2))
            _set(pis_tipo, 'vBC', f"{it['val']:.2f}")
            _set(pis_tipo, 'pPIS', '0.00')
            _set(pis_tipo, 'vPIS', '0.00')

        # COFINS
        cofins_wrap = etree.SubElement(imposto, f'{{{NS}}}COFINS')
        cst_cofins = str(it.get('cst_cofins') or '07')
        if cst_cofins in ('07', '08', '09'):
            cof_tipo = etree.SubElement(cofins_wrap, f'{{{NS}}}COFINSNT')
            _set(cof_tipo, 'CST', cst_cofins)
        else:
            cof_tipo = etree.SubElement(cofins_wrap, f'{{{NS}}}COFINSAliq')
            _set(cof_tipo, 'CST', cst_cofins.zfill(2))
            _set(cof_tipo, 'vBC', f"{it['val']:.2f}")
            _set(cof_tipo, 'pCOFINS', '0.00')
            _set(cof_tipo, 'vCOFINS', '0.00')

        inf_nfe_el.insert(total_idx + idx - 1, det)

    # ── 6. Atualiza totais ───────────────────────────────────────────────────
    v_prod = sum(it['val'] for it in itens_rateados)

    # Reconstrói ICMSTot na ordem correta
    icms_tot = root.find('.//nfe:total/nfe:ICMSTot', NS_MAP)
    if icms_tot is not None:
        icms_tot.clear()
        campos = [
            ('vBC', '0.00'), ('vICMS', '0.00'), ('vICMSDeson', '0.00'),
            ('vFCPUFDest', '0.00'), ('vICMSUFDest', '0.00'), ('vICMSUFRemet', '0.00'),
            ('vFCP', '0.00'), ('vBCST', '0.00'), ('vST', '0.00'),
            ('vFCPST', '0.00'), ('vFCPSTRet', '0.00'),
            ('qBCMonoRet', '0.00'), ('vICMSMonoRet', '0.00'),
            ('vProd', f'{v_prod:.2f}'),
            ('vFrete', '0.00'), ('vSeg', '0.00'), ('vDesc', '0.00'),
            ('vII', '0.00'), ('vIPI', '0.00'), ('vIPIDevol', '0.00'),
            ('vPIS', '0.00'), ('vCOFINS', '0.00'),
            ('vOutro', '0.00'),
            ('vNF', f'{valor_total:.2f}'),
            ('vTotTrib', '0.00'),
        ]
        for tag, val in campos:
            el = etree.SubElement(icms_tot, f'{{{NS}}}{tag}')
            el.text = val
        
        pag_vpag = root.find('.//nfe:pag/nfe:detPag/nfe:vPag', NS_MAP)
        if pag_vpag is not None:
            pag_vpag.text = f"{valor_total:.2f}"

    # ── 6b. Atualiza pagamento ────────────────────────────────────────────────
    det_pag = root.find('.//nfe:pag/nfe:detPag', NS_MAP)
    if det_pag is not None:
        det_pag.clear()
        _set(det_pag, 'indPag', '0')
        _set(det_pag, 'tPag', '01')  # 01 = dinheiro (genérico)
        _set(det_pag, 'vPag', f'{valor_total:.2f}')

    # Remove vTroco se existir
    pag_el = root.find('.//nfe:pag', NS_MAP)
    if pag_el is not None:
        v_troco = pag_el.find(f'{{{NS}}}vTroco')
        if v_troco is not None:
            pag_el.remove(v_troco)

    # ── 6c. Garante indIntermed no ide ───────────────────────────────────────
    ide_el = root.find('.//nfe:ide', NS_MAP)
    if ide_el is not None and ide_el.find(f'{{{NS}}}indIntermed') is None:
        proc_emi = ide_el.find(f'{{{NS}}}procEmi')
        if proc_emi is not None:
            idx_proc = list(ide_el).index(proc_emi)
            ind = etree.Element(f'{{{NS}}}indIntermed')
            ind.text = '0'
            ide_el.insert(idx_proc, ind)

    # ── 6d. Garante infAdic ───────────────────────────────────────────────────
    inf_nfe_el2 = root.find(f'.//{{{NS}}}infNFe')
    if inf_nfe_el2 is not None and inf_nfe_el2.find(f'{{{NS}}}infAdic') is None:
        inf_adic = etree.SubElement(inf_nfe_el2, f'{{{NS}}}infAdic')
        inf_cpl = etree.SubElement(inf_adic, f'{{{NS}}}infCpl')
        inf_cpl.text = 'XML reconstituido'

    # ── 7. Aplica chave de acesso da planilha ────────────────────────────────
    inf_nfe = root.find('.//nfe:infNFe', NS_MAP)
    inf_nfe.set('Id', f'NFe{chave}')

    cnfe_el = root.find('.//nfe:ide/nfe:cNF', NS_MAP)
    if cnfe_el is not None:
        cnfe_el.text = c_nf

    # Remove assinatura anterior do modelo se existir
    sig_ns = 'http://www.w3.org/2000/09/xmldsig#'

    # Tenta remover do root (nfeProc)
    sig = root.find(f'{{{sig_ns}}}Signature')
    if sig is not None:
        root.remove(sig)

    # Tenta remover do NFe (caso o modelo seja nfeProc)
    nfe_el = root.find(f'.//{{{NS}}}NFe')
    if nfe_el is not None:
        sig = nfe_el.find(f'{{{sig_ns}}}Signature')
        if sig is not None:
            nfe_el.remove(sig)

    # ── 7b. Atualiza infNFeSupl ──────────────────────────────────────────────
    inf_nfe_supl = root.find(f'.//{{{NS}}}infNFeSupl')
    if inf_nfe_supl is not None:
        qr_code_el = inf_nfe_supl.find(f'{{{NS}}}qrCode')
        url_chave_el = inf_nfe_supl.find(f'{{{NS}}}urlChave')
        if qr_code_el is not None:
            # Monta URL básica com a nova chave (sem hash — para consulta simples)
            uf_url = 'mt'  # ajusta se necessário
            qr_code_el.text = (
                f"http://www.sefaz.{uf_url}.gov.br/nfce/consultanfce"
                f"?p={chave}|2|1|1|"
            )
        if url_chave_el is not None:
            url_chave_el.text = f"http://www.sefaz.{uf_url}.gov.br/nfce/consultanfce"

    # ── 8. Serializa para bytes (sem assinatura ainda) ───────────────────────
    xml_bytes = etree.tostring(
        root,
        xml_declaration=True,
        encoding='UTF-8',
        pretty_print=False,
    )

    # ── 9. Assina com certificado A1 da empresa ──────────────────────────────
    private_key_pem, cert_pem = _carregar_certificado(empresa)
    xml_bytes_assinado = _assinar_xml(xml_bytes, private_key_pem, cert_pem)

    # ── 10. Envolve em nfeProc com protocolo real ─────────────────────────────
    ver_aplic_el = root.find('.//nfe:verAplic', NS_MAP)
    ver_aplic = ver_aplic_el.text if ver_aplic_el is not None else 'NFCe_v4.00'
    if protocolo:
        xml_bytes_assinado = _adicionar_protocolo(xml_bytes_assinado, chave, protocolo, data_emissao, ver_aplic)

    return xml_bytes_assinado, chave