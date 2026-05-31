import django_filters
from .models import Documento

class DocumentoFilter(django_filters.FilterSet):
    class Meta:
        model = Documento
        fields = {
            'empresa': ['exact'],
            'tipo': ['exact'],
            'status': ['exact'],
            'numero_nota': ['exact'],
            'serie': ['exact'],
            'data_emissao': ['exact', 'gte', 'lte', 'year', 'month', 'day'],
        }