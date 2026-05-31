from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
import os
import zipfile
import io

from apps.empresas.models import Empresa
from apps.documentos.models import Documento


MESES_PT = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
}


@shared_task
def enviar_xmls_mes_anterior():
    """
    Roda no dia 1 de cada mês.
    Para cada empresa ativa com email_contabilidade, envia um .zip por tipo
    de documento (NFe, NFCe, CTe, etc.) com todos os XMLs do mês anterior.
    """
    hoje = date.today()
    mes_anterior = hoje - relativedelta(months=1)
    ano = mes_anterior.year
    mes = mes_anterior.month
    nome_mes = MESES_PT[mes]

    empresas = Empresa.objects.filter(
        desativado=False,
        email_contabilidade__isnull=False,
    ).exclude(email_contabilidade='')

    for empresa in empresas:
        documentos = Documento.objects.filter(
            empresa=empresa,
            data_emissao__year=ano,
            data_emissao__month=mes,
        )

        if not documentos.exists():
            continue

        tipos = documentos.values_list('tipo', flat=True).distinct()
        anexos = []
        total_geral = 0

        for tipo in tipos:
            docs_tipo = documentos.filter(tipo=tipo)
            zip_buffer = io.BytesIO()
            arquivos_incluidos = 0

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                for doc in docs_tipo:
                    caminho_completo = os.path.join(settings.MEDIA_ROOT, doc.caminho_arquivo)
                    if os.path.exists(caminho_completo):
                        zf.write(caminho_completo, arcname=os.path.basename(caminho_completo))
                        arquivos_incluidos += 1

            if arquivos_incluidos == 0:
                continue

            zip_buffer.seek(0)
            nome_arquivo = f"xmls_{empresa.codigo_interno}_{tipo}_{nome_mes}_{ano}.zip"
            anexos.append((nome_arquivo, zip_buffer.read(), arquivos_incluidos, tipo))
            total_geral += arquivos_incluidos

        if not anexos:
            continue

        resumo = '\n'.join(
            f'  • {tipo}: {qtd} documento{"s" if qtd > 1 else ""}'
            for _, _, qtd, tipo in anexos
        )

        email = EmailMessage(
            subject=f'XMLs de {nome_mes}/{ano} — {empresa.nome_fantasia}',
            body=(
                f'Olá,\n\n'
                f'Segue em anexo os documentos fiscais de {nome_mes}/{ano} '
                f'da empresa {empresa.nome_fantasia} (CNPJ: {empresa.cnpj}).\n\n'
                f'Total de documentos: {total_geral}\n'
                f'{resumo}\n\n'
                f'Atenciosamente,\nFiscalHub'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[empresa.email_contabilidade],
        )

        for nome_arquivo, conteudo, _, _ in anexos:
            email.attach(nome_arquivo, conteudo, 'application/zip')

        email.send(fail_silently=False)


@shared_task
def enviar_xmls_empresa(empresa_id, data_inicio=None, data_fim=None):
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

    if not documentos.exists():
        return

    tipos = documentos.values_list('tipo', flat=True).distinct()
    anexos = []
    total_geral = 0

    for tipo in tipos:
        docs_tipo = documentos.filter(tipo=tipo)
        zip_buffer = io.BytesIO()
        arquivos_incluidos = 0

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for doc in docs_tipo:
                caminho_completo = os.path.join(settings.MEDIA_ROOT, doc.caminho_arquivo)
                try:
                    if os.path.exists(caminho_completo):
                        zf.write(caminho_completo, arcname=os.path.basename(caminho_completo))
                        arquivos_incluidos += 1
                except Exception:
                    continue  # pula arquivos problemáticos sem travar

        if arquivos_incluidos == 0:
            continue

        zip_buffer.seek(0)
        conteudo = zip_buffer.read()
        nome_arquivo = f"xmls_{empresa.codigo_interno}_{tipo}_{label_periodo}.zip"
        anexos.append((nome_arquivo, conteudo, arquivos_incluidos, tipo))

    if not anexos:
        return

    resumo = '\n'.join(
        f'  • {tipo}: {qtd} documento{"s" if qtd > 1 else ""}'
        for _, _, qtd, tipo in anexos
    )

    email = EmailMessage(
        subject=f'XMLs de {label_periodo} — {empresa.nome_fantasia}',
        body=(
            f'Olá,\n\n'
            f'Segue em anexo os documentos fiscais de {label_periodo} '
            f'da empresa {empresa.nome_fantasia} (CNPJ: {empresa.cnpj}).\n\n'
            f'Total de documentos: {total_geral}\n'
            f'{resumo}\n\n'
            f'Atenciosamente,\nFiscalHub'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[empresa.email_contabilidade],
    )

    for nome_arquivo, conteudo, _, _ in anexos:
        email.attach(nome_arquivo, conteudo, 'application/zip')

    email.send(fail_silently=False)