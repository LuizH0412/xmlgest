from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
import os
import zipfile
import hashlib
import json

from apps.empresas.models import Empresa
from apps.documentos.models import Documento, ExportacaoXml


MESES_PT = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
}


def _gerar_zip_e_enviar_email(empresa, documentos, label_periodo, filtros_extras=None):
    pasta_export = os.path.join(settings.MEDIA_ROOT, 'exports')
    os.makedirs(pasta_export, exist_ok=True)

    nome_safe = label_periodo.replace('/', '-').replace(' ', '_')
    tipos = set(documentos.values_list('tipo', flat=True))

    links = []
    total_geral = 0

    if filtros_extras:
        filtros_str = json.dumps(filtros_extras, sort_keys=True)
        sufixo = '_' + hashlib.md5(filtros_str.encode()).hexdigest()[:8]
    else:
        sufixo = ''

    for tipo in tipos:
        docs_tipo = documentos.filter(tipo=tipo)
        nome_arquivo = f"XMLS {empresa.razao_social} - {tipo} - {nome_safe}{sufixo}.zip"
        caminho_zip = os.path.join(pasta_export, nome_arquivo)

        # Se o zip já existe, reutiliza o ExportacaoXml existente
        if os.path.exists(caminho_zip):
            exportacao, _ = ExportacaoXml.objects.get_or_create(
                empresa=empresa,
                caminho_arquivo=caminho_zip,
                label_periodo=label_periodo,
            )
            link = f"{settings.SITE_URL}/api/documentos/download-export/{exportacao.token}/"
            links.append((tipo, docs_tipo.count(), link))
            total_geral += docs_tipo.count()
            continue

        # Gera o zip
        arquivos_incluidos = 0
        with zipfile.ZipFile(caminho_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            for doc in docs_tipo:
                caminho_completo = os.path.join(settings.MEDIA_ROOT, doc.caminho_arquivo)
                try:
                    if os.path.exists(caminho_completo):
                        zf.write(caminho_completo, arcname=os.path.basename(caminho_completo))
                        arquivos_incluidos += 1
                except Exception:
                    continue

        if arquivos_incluidos == 0:
            os.remove(caminho_zip)
            continue

        exportacao = ExportacaoXml.objects.create(
            empresa=empresa,
            caminho_arquivo=caminho_zip,
            label_periodo=label_periodo,
        )

        link = f"{settings.SITE_URL}/api/documentos/download-export/{exportacao.token}/"
        links.append((tipo, arquivos_incluidos, link))
        total_geral += arquivos_incluidos

    if not links:
        return

    resumo = '\n'.join(
        f'  • {tipo}: {qtd} documento{"s" if qtd > 1 else ""}\n    Download: {link}'
        for tipo, qtd, link in links
    )

    email = EmailMessage(
        subject=f'XMLs de {label_periodo} — {empresa.nome_fantasia}',
        body=(
            f'Olá,\n\n'
            f'Os documentos fiscais de {label_periodo} da empresa '
            f'{empresa.nome_fantasia} (CNPJ: {empresa.cnpj}) estão disponíveis para download.\n\n'
            f'Total de documentos: {total_geral}\n'
            f'{resumo}\n\n'
            f'Atenciosamente,\nSoftcom'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[empresa.email_contabilidade],
    )

    email.send(fail_silently=False)


@shared_task
def enviar_xmls_mes_anterior():
    """
    Roda no dia 1 de cada mês.
    Para cada empresa ativa com email_contabilidade, envia um link de download
    com todos os XMLs do mês anterior.
    """
    hoje = date.today()
    mes_anterior = hoje - relativedelta(months=1)
    nome_mes = MESES_PT[mes_anterior.month]
    label_periodo = f'{nome_mes}/{mes_anterior.year}'

    empresas = Empresa.objects.filter(
        desativado=False,
        email_contabilidade__isnull=False,
    ).exclude(email_contabilidade='')

    for empresa in empresas:
        documentos = Documento.objects.filter(
            empresa=empresa,
            data_emissao__year=mes_anterior.year,
            data_emissao__month=mes_anterior.month,
        )

        if not documentos.exists():
            continue

        _gerar_zip_e_enviar_email(empresa, documentos, label_periodo)


@shared_task
def enviar_xmls_empresa(empresa_id, data_inicio=None, data_fim=None, tipo=None, serie=None, numero_nota=None):
    hoje = date.today()

    try:
        empresa = Empresa.objects.get(id=empresa_id)
    except Empresa.DoesNotExist:
        return

    if not empresa.email_contabilidade:
        return

    documentos = Documento.objects.filter(empresa=empresa)

    if data_inicio and data_fim:
        documentos = documentos.filter(
            data_emissao__gte=data_inicio,
            data_emissao__lte=data_fim,
        )
        inicio_fmt = datetime.strptime(data_inicio, '%Y-%m-%d').strftime('%d/%m/%Y')
        fim_fmt = datetime.strptime(data_fim, '%Y-%m-%d').strftime('%d/%m/%Y')
        label_periodo = f'{inicio_fmt} a {fim_fmt}'
    else:
        mes_anterior = hoje - relativedelta(months=1)
        documentos = documentos.filter(
            data_emissao__year=mes_anterior.year,
            data_emissao__month=mes_anterior.month,
        )
        label_periodo = f'{MESES_PT[mes_anterior.month]}/{mes_anterior.year}'

    if tipo:
        documentos = documentos.filter(tipo=tipo)
    if serie:
        documentos = documentos.filter(serie=serie)
    if numero_nota:
        documentos = documentos.filter(numero_nota=numero_nota)

    if not documentos.exists():
        return

    filtros_extras = {}
    if tipo:
        filtros_extras['tipo'] = tipo
    if serie:
        filtros_extras['serie'] = serie
    if numero_nota:
        filtros_extras['numero_nota'] = numero_nota

    _gerar_zip_e_enviar_email(empresa, documentos, label_periodo, filtros_extras=filtros_extras or None)