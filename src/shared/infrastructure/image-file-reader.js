/**
 * Reads an image file chosen by the user as a data URL, so it can be stored by the Fake API.
 *
 * @param {File} file - The chosen file.
 * @param {number} [maxBytes=2097152] - Maximum size (2 MB).
 * @returns {Promise<string>} The data URL.
 */
export const readImageAsDataUrl = (file, maxBytes = 2 * 1024 * 1024) => new Promise((resolve, reject) => {
    if (!file) return reject('Elige una imagen.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject('La imagen debe ser JPG, PNG o WEBP.');
    if (file.size > maxBytes) return reject('La imagen no debe pesar más de 2 MB.');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject('No se pudo leer la imagen.');
    reader.readAsDataURL(file);
});
