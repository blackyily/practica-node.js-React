// Componente para renderizar la foto de perfil o un avatar con las iniciales
export function Avatar({ src, nombre = 'Usuario', size = 64, className = '' }) {
  // Obtener la inicial del nombre o del usuario
  const inicial = (nombre || 'U').trim().charAt(0).toUpperCase();

  const estiloContenedor = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    objectFit: 'cover',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`Foto de ${nombre}`}
        style={estiloContenedor}
        className={`border border-2 border-white shadow-sm ${className}`}
        onError={(e) => {
          // Si la imagen no carga, ocultar y mostrar inicial
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...estiloContenedor,
        backgroundColor: '#0d6efd',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: `${Math.round(size * 0.42)}px`,
      }}
      className={`shadow-sm border border-2 border-white ${className}`}
    >
      {inicial}
    </div>
  );
}

export default Avatar;
