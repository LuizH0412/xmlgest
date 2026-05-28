from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil == 'admin'
    
class IsAdminOrSupervisao(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in ['admin', 'supervisao']
    
class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
class PaginacaoPadrao(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100