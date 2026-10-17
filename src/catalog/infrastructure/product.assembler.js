import {Product} from '@/catalog/domain/model/product.entity.js';

/**
 * Converts PRODUCTO resources into Product entities and back.
 */
export const ProductAssembler = {
    /** @param {Object} resource @returns {Product} */
    toEntity(resource) {
        return new Product({
            id: resource.id, businessId: resource.idNegocio, description: resource.descripcion, brand: resource.marca, supplier: resource.proveedor ?? '',
            unit: resource.unidadMedida, imageUrl: resource.imagenUrl ?? '', cashPrice: Number(resource.precioContado), listPrice: Number(resource.precioLista),
            saleMode: resource.modalidadVenta, status: resource.estado
        });
    },

    /** @param {import('axios').AxiosResponse} response @returns {Product[]} */
    toEntities(response) {
        return (response.data ?? []).map(resource => this.toEntity(resource));
    },

    /** @param {Product} product @returns {Object} */
    toResource(product) {
        return {
            idNegocio: product.businessId, descripcion: product.description.trim(), marca: product.brand.trim(), proveedor: product.supplier.trim(),
            unidadMedida: product.unit, imagenUrl: product.imageUrl, precioContado: product.cashPrice, precioLista: product.listPrice,
            modalidadVenta: product.saleMode, estado: product.status
        };
    }
};
