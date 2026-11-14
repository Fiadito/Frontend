import {Product, ProductType} from '@/catalog/domain/model/product.entity.js';

/**
 * Converts PRODUCTO resources (products and combos) into Product entities and back.
 */
export const ProductAssembler = {
    /** @param {Object} resource @returns {Product} */
    toEntity(resource) {
        return new Product({
            id: resource.id, businessId: resource.idNegocio, type: resource.tipo ?? ProductType.PRODUCT, description: resource.descripcion,
            brand: resource.marca, supplier: resource.proveedor ?? '', unit: resource.unidadMedida, imageUrl: resource.imagenUrl ?? '',
            cashPrice: Number(resource.precioContado), listPrice: Number(resource.precioLista), saleMode: resource.modalidadVenta,
            status: resource.estado,
            items: (resource.items ?? []).map(item => ({
                productId: item.idProducto, productName: item.producto, quantity: item.cantidad, listPrice: Number(item.precioLista),
                subtotal: Number(item.subtotal)
            })),
            contentValue: resource.valorContenido === null || resource.valorContenido === undefined ? null : Number(resource.valorContenido)
        });
    },

    /** @param {import('axios').AxiosResponse} response @returns {Product[]} */
    toEntities(response) {
        return (response.data ?? []).map(resource => this.toEntity(resource));
    },

    /** @param {Product} product @returns {Object} */
    toResource(product) {
        return {
            tipo: product.type, descripcion: product.description.trim(), marca: product.brand.trim(), proveedor: product.supplier.trim(),
            unidadMedida: product.unit, imagenUrl: product.imageUrl, precioContado: product.isCombo ? product.listPrice : product.cashPrice,
            precioLista: product.listPrice, modalidadVenta: product.saleMode,
            items: product.isCombo ? product.items.map(item => ({idProducto: item.productId, cantidad: item.quantity})) : []
        };
    }
};
