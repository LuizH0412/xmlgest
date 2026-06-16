from .models import Auditoria


def registrar(request, acao, detalhes=None, empresa=None):
    usuario = request.user if request.user.is_authenticated else None

    ip = request.META.get('HTTP_X_FORWARDED_FOR')
    if ip:
        ip = ip.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')

    Auditoria.objects.create(
        usuario=usuario,
        empresa=empresa,
        acao=acao,
        detalhes=detalhes,
        ip_origem=ip,
    )