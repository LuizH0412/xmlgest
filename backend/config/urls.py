from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.usuarios.views import UsuarioViewSet
from apps.empresas.views import EmpresaViewSet
from apps.documentos.views import DocumentoViewSet
from django.conf import settings
from django.conf.urls.static import static
from apps.empresas.views_auth import ColetorTokenView
from apps.empresas.views import empresas_sem_xml, empresa_por_codigo
from apps.usuarios.views import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'empresas', EmpresaViewSet, basename='empresas')
router.register(r'documentos', DocumentoViewSet, basename='documentos')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/coletor/', ColetorTokenView.as_view(), name='token_coletor'),
    path('api/alertas/empresas-sem-xml/', empresas_sem_xml),
    path('api/empresas/codigo/<str:codigo>/', empresa_por_codigo),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)