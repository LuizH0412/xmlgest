import xml.etree.ElementTree as ET
from datetime import datetime

def detectar_tipo(root, ns):
    mod = root.find('.//nfe:ide/nfe:mod', ns)
    if mod is not None:
        if mod.text == '55':
            return 'NFe'
        elif mod.text == '65':
            return 'NFCe'
    # verificar CTe e MDFe depois
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
        cnpj_emitente = root.find('.//nfe:emit/nfe:CNPJ', ns).text
        numero_nota = root.find('.//nfe:ide/nfe:nNF', ns).text
        serie = root.find('.//nfe:ide/nfe:serie', ns).text
        data_emissao_raw = root.find('.//nfe:ide/nfe:dhEmi', ns).text
        data_emissao = datetime.fromisoformat(data_emissao_raw).date()
        valor_total = root.find('.//nfe:total/nfe:ICMSTot/nfe:vNF', ns).text
        return {
                'chave_acesso': chave,
                'cnpj_emitente': cnpj_emitente,
                'numero_nota': numero_nota,
                'serie': serie,
                'data_emissao': data_emissao,
                'valor_total': valor_total,
                'tipo': detectar_tipo(root, ns),
                'status': 'autorizado'
        }
    except ET.ParseError:
        raise ValueError('Arquivo XML inválido')