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
    from apps.empresas.utils import descriptografar_senha

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
    """
    Assina o XML usando o certificado A1 da empresa.
    Retorna xml_bytes assinado.
    """
    root = etree.fromstring(xml_bytes)

    inf_nfe = root.find(f'.//{{{NS}}}infNFe')
    if inf_nfe is None:
        raise ValueError('infNFe não encontrado no XML para assinar.')

    ref_uri = inf_nfe.get('Id')

    signer = XMLSigner(
        method=methods.enveloped,
        signature_algorithm='rsa-sha1',
        digest_algorithm='sha1',
        c14n_algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    )

    signed_root = signer.sign(
        root,
        key=private_key_pem,
        cert=cert_pem,
        reference_uri=f'#{ref_uri}',
    )

    return etree.tostring(
        signed_root,
        xml_declaration=True,
        encoding='UTF-8',
        pretty_print=False,
    )


def gerar_xml_nota(empresa, numero_nota, serie, valor_total_sefaz, data_emissao):
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

    _upd('.//nfe:ide/nfe:nNF', str(numero_nota))
    _upd('.//nfe:ide/nfe:serie', str(serie))
    _upd('.//nfe:ide/nfe:dhEmi', f"{data_emissao.isoformat()}T00:00:00-03:00")

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

        prod = etree.SubElement(det, f'{{{NS}}}prod')
        _set(prod, 'cProd', str(idx).zfill(6))
        _set(prod, 'cEAN', 'SEM GTIN')
        _set(prod, 'xProd', it['descricao'] or 'PRODUTO')
        _set(prod, 'NCM', it['ncm'] or '00000000')
        if it.get('cest'):
            _set(prod, 'CEST', it['cest'])
        _set(prod, 'CFOP', it['cfop'] or '5102')
        _set(prod, 'uCom', 'UN')
        _set(prod, 'qCom', f"{it['qtd']:.4f}")
        _set(prod, 'vUnCom', f"{it['v_unit']:.7f}")
        _set(prod, 'vProd', f"{it['val']:.2f}")
        _set(prod, 'cEANTrib', 'SEM GTIN')
        _set(prod, 'uTrib', 'UN')
        _set(prod, 'qTrib', f"{it['qtd']:.4f}")
        _set(prod, 'vUnTrib', f"{it['v_unit']:.7f}")
        _set(prod, 'indTot', '1')

        imposto = etree.SubElement(det, f'{{{NS}}}imposto')

        # ICMS
        icms_wrap = etree.SubElement(imposto, f'{{{NS}}}ICMS')
        cst_icms = str(it.get('cst_icms') or '00')
        if len(cst_icms) == 3:  # CSOSN (Simples Nacional)
            icms_tipo = etree.SubElement(icms_wrap, f'{{{NS}}}ICMSSN102')
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
            pis_tipo = etree.SubElement(pis_wrap, f'{{{NS}}}PISOutr')
            _set(pis_tipo, 'CST', cst_pis)
            _set(pis_tipo, 'vBC', '0.00')
            _set(pis_tipo, 'pPIS', '0.00')
            _set(pis_tipo, 'vPIS', '0.00')
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
            cof_tipo = etree.SubElement(cofins_wrap, f'{{{NS}}}COFINSOutr')
            _set(cof_tipo, 'CST', cst_cofins)
            _set(cof_tipo, 'vBC', '0.00')
            _set(cof_tipo, 'pCOFINS', '0.00')
            _set(cof_tipo, 'vCOFINS', '0.00')
        else:
            cof_tipo = etree.SubElement(cofins_wrap, f'{{{NS}}}COFINSAliq')
            _set(cof_tipo, 'CST', cst_cofins.zfill(2))
            _set(cof_tipo, 'vBC', f"{it['val']:.2f}")
            _set(cof_tipo, 'pCOFINS', '0.00')
            _set(cof_tipo, 'vCOFINS', '0.00')

        inf_nfe_el.insert(total_idx + idx - 1, det)

    # ── 6. Atualiza totais ───────────────────────────────────────────────────
    icms_tot = root.find('.//nfe:total/nfe:ICMSTot', NS_MAP)
    if icms_tot is not None:
        for campo in ['vBC','vICMS','vICMSDeson','vFCP','vBCST','vST','vFCPST',
                      'vFCPSTRet','vFrete','vSeg','vDesc','vII','vIPI',
                      'vIPIDevol','vPIS','vCOFINS','vOutro']:
            el = icms_tot.find(f'nfe:{campo}', NS_MAP)
            if el is not None:
                el.text = '0.00'
        for campo in ['vNF', 'vProd']:
            el = icms_tot.find(f'nfe:{campo}', NS_MAP)
            if el is not None:
                el.text = f"{valor_total:.2f}"

    # ── 7. Gera chave de acesso ──────────────────────────────────────────────
    cnpj = empresa.cnpj.replace('.','').replace('/','').replace('-','')
    ano_mes = data_emissao.strftime('%y%m')
    serie_str = str(serie).zfill(3)
    n_nota_str = str(numero_nota).zfill(9)
    c_nf = str(random.randint(10000000, 99999999))

    cuf_el = root.find('.//nfe:ide/nfe:cUF', NS_MAP)
    cuf = cuf_el.text if cuf_el is not None else '41'

    chave_43 = f"{cuf}{ano_mes}{cnpj}55{serie_str}{n_nota_str}1{c_nf}"
    dv = _calc_dv(chave_43)
    chave = chave_43 + str(dv)

    inf_nfe = root.find('.//nfe:infNFe', NS_MAP)
    inf_nfe.set('Id', f'NFe{chave}')

    cnfe_el = root.find('.//nfe:ide/nfe:cNF', NS_MAP)
    if cnfe_el is not None:
        cnfe_el.text = c_nf

    # Remove assinatura anterior do modelo se existir
    sig_ns = 'http://www.w3.org/2000/09/xmldsig#'
    sig = root.find(f'{{{sig_ns}}}Signature')
    if sig is not None:
        root.remove(sig)

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

    return xml_bytes_assinado, chave