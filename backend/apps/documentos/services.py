import xml.etree.ElementTree as ET
from datetime import datetime


def detectar_tipo(root, ns):
    mod = root.find('.//nfe:ide/nfe:mod', ns)

    if mod is not None:
        if mod.text == '55':
            return 'NFe'
        elif mod.text == '65':
            return 'NFCe'

    return None


def extrair_dados(arquivo):
    try:
        tree = ET.parse(arquivo)
        root = tree.getroot()

        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}

        inf_nfe = root.find('.//nfe:infNFe', ns)

        if inf_nfe is None:
            raise ValueError('XML não é uma NFe válida')

        chave = inf_nfe.attrib['Id'].replace('NFe', '')

        # CNPJ ou CPF do emitente
        emit = root.find('.//nfe:emit', ns)

        cnpj_emitente = None

        if emit is not None:
            cnpj = emit.find('nfe:CNPJ', ns)
            cpf = emit.find('nfe:CPF', ns)

            if cnpj is not None:
                cnpj_emitente = cnpj.text
            elif cpf is not None:
                cnpj_emitente = cpf.text

        numero_nota = root.find('.//nfe:ide/nfe:nNF', ns).text
        serie = root.find('.//nfe:ide/nfe:serie', ns).text

        data_emissao_raw = root.find(
            './/nfe:ide/nfe:dhEmi',
            ns
        ).text

        data_emissao = datetime.fromisoformat(
            data_emissao_raw
        ).date()

        valor_total = root.find(
            './/nfe:total/nfe:ICMSTot/nfe:vNF',
            ns
        ).text

        itens = []

        for det in root.findall('.//nfe:det', ns):
            prod = det.find('nfe:prod', ns)
            imposto = det.find('nfe:imposto', ns)

            cst_icms = None

            icms_grupo = (
                imposto.find('.//nfe:ICMS', ns)
                if imposto is not None
                else None
            )

            if icms_grupo is not None:
                cst_tag = (
                    icms_grupo.find('./*/nfe:CST', ns)
                    or icms_grupo.find('./*/nfe:CSOSN', ns)
                )

                if cst_tag is not None:
                    cst_icms = cst_tag.text

            cst_pis = None

            pis = (
                imposto.find('.//nfe:PIS', ns)
                if imposto is not None
                else None
            )

            if pis is not None:
                cst_pis_tag = pis.find('./*/nfe:CST', ns)

                if cst_pis_tag is not None:
                    cst_pis = cst_pis_tag.text

            cst_cofins = None

            cofins = (
                imposto.find('.//nfe:COFINS', ns)
                if imposto is not None
                else None
            )

            if cofins is not None:
                cst_cofins_tag = cofins.find('./*/nfe:CST', ns)

                if cst_cofins_tag is not None:
                    cst_cofins = cst_cofins_tag.text

            def txt(tag):
                el = (
                    prod.find(f'nfe:{tag}', ns)
                    if prod is not None
                    else None
                )

                return el.text if el is not None else None

            itens.append({
                'numero_item': int(det.attrib.get('nItem', 0)),
                'descricao': txt('xProd'),
                'ncm': txt('NCM'),
                'cest': txt('CEST'),
                'cfop': txt('CFOP'),
                'cst_icms': cst_icms,
                'cst_pis': cst_pis,
                'cst_cofins': cst_cofins,
                'quantidade': txt('qCom'),
                'valor_unitario': txt('vUnCom'),
                'valor_total': txt('vProd'),
            })

        return {
            'chave_acesso': chave,
            'cnpj_emitente': cnpj_emitente,
            'numero_nota': numero_nota,
            'serie': serie,
            'data_emissao': data_emissao,
            'valor_total': valor_total,
            'tipo': detectar_tipo(root, ns),
            'status': 'autorizado',
            'itens': itens,
        }

    except ET.ParseError:
        raise ValueError('Arquivo XML inválido')
