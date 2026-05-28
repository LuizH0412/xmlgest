from rest_framework.routers import DefaultRouter
from .views import DocumentoViewSet

router = DefaultRouter()
router.register(r'documentos', DocumentoViewSet, basename='documentos')

urlpatterns = router.urls