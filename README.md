# Examen Licencia AR

Simulador de examen teórico para obtener la licencia de conducir en la provincia de Santa Fe, Argentina. Permite practicar preguntas y repasar los temas del examen de manera interactiva.

> **Aviso**
> Proyecto personal sin relación con organismos oficiales. Los tests son orientativos y no representan el examen real.

## ¿Cómo funciona?

- Carga un banco de preguntas y las presenta de forma aleatoria.
- El usuario selecciona las respuestas y al finalizar obtiene un resumen de resultados.
- Todo se ejecuta en el navegador; no hay backend ni almacenamiento de datos.

## Tecnologías utilizadas

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) para el desarrollo de la interfaz.
- [TypeScript](https://www.typescriptlang.org/) para tipado estático.
- [Tailwind CSS](https://tailwindcss.com/) para los estilos.
- Otras librerías: Headless UI, Heroicons, React Router DOM, i18next, Framer Motion.

## Dependencias principales

Las dependencias completas están en [`package.json`](./package.json). Algunas destacadas son:

- `react` y `react-dom`
- `react-router-dom`
- `i18next` y `react-i18next`
- `framer-motion`
- `@headlessui/react` y `@heroicons/react`
- `tailwindcss` y plugins oficiales

## Desarrollo

Instalá las dependencias y levantá el servidor de desarrollo:

```bash
npm install
npm run dev
```

Generá una versión de producción:

```bash
npm run build
```

Podés previsualizar la compilación con:

```bash
npm run preview
```

---

Este proyecto es una forma rápida de aproximar las preguntas que pueden tomarse en el examen y facilitar el estudio y la práctica. No garantiza resultados reales ni reemplaza la preparación oficial.

