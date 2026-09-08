/**
 * Helper genérico para descargar un PDF desde un endpoint protegido.
 *
 * No se usa `<a href="/api/.../pdf">` directo porque el endpoint exige el
 * header `Authorization: Bearer <token>`, que vive en `localStorage` y el
 * navegador no lo envía en una navegación simple. En su lugar, hacemos
 * `fetch` con el header, obtenemos el `blob`, lo convertimos en una URL
 * temporal y disparamos un clic programático en un `<a download>`.
 *
 * @throws Error con mensaje en español si el servidor devuelve 401, 404
 *         u otro error.
 */
export async function descargarPDF(ruta: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesión expirada — vuelve a iniciar sesión');
  }

  const res = await fetch(ruta, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Sesión expirada — vuelve a iniciar sesión');
    }
    if (res.status === 404) {
      throw new Error('Recurso no encontrado');
    }
    // Intentamos extraer el mensaje JSON del backend; si no, statusText
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error ?? `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Intentar extraer filename del header Content-Disposition
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? inferirFilename(ruta);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Liberar memoria después de un tick para que el navegador alcance
  // a procesar la descarga antes de invalidar la URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Si el servidor no envía Content-Disposition, deriva un nombre razonable
 * a partir del último segmento de la ruta + ".pdf".
 */
function inferirFilename(ruta: string): string {
  const segmento = ruta.split('/').filter(Boolean).pop() ?? 'documento';
  return segmento.endsWith('.pdf') ? segmento : `${segmento}.pdf`;
}