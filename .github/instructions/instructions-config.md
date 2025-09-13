# Configuración de Variables para Instrucciones

Las instrucciones de testing pueden ser parametrizadas usando variables que se evalúan según el contexto del proyecto. Esto permite tener un solo archivo de instrucciones que se adapte a diferentes tecnologías.

## Variables Disponibles

### Framework y Lenguaje
- `FRAMEWORK`: React, Vue, Angular, Svelte (default: React)
- `LANGUAGE`: TypeScript, JavaScript (default: JavaScript)

### Herramientas de Testing  
- `TEST_FRAMEWORK`: Jest, Vitest, Playwright (default: Jest)
- `TESTING_LIBRARY`: @testing-library/react, @testing-library/vue, etc. (default: React Testing Library)
- `USER_EVENT_LIB`: @testing-library/user-event, @vue/test-utils (default: @testing-library/user-event)
- `ASSERTION_LIB`: jest-dom matchers, @testing-library/jest-dom (default: jest-dom matchers)

### Infraestructura
- `INFRASTRUCTURE`: Tu infraestructura de deployment (default: AWS primary and Azure DevOps for CI/CD)

## Cómo usar las Variables

### Ejemplo 1: Para proyectos React con TypeScript
```
FRAMEWORK=React
LANGUAGE=TypeScript
TEST_FRAMEWORK=Jest
```

### Ejemplo 2: Para proyectos Vue con JavaScript y Vitest
```
FRAMEWORK=Vue
LANGUAGE=JavaScript
TEST_FRAMEWORK=Vitest
TESTING_LIBRARY=@testing-library/vue
```

### Ejemplo 3: Para proyectos Angular con TypeScript
```
FRAMEWORK=Angular
LANGUAGE=TypeScript
TEST_FRAMEWORK=Jest
TESTING_LIBRARY=@testing-library/angular
```

## Sintaxis de Variables en las Instrucciones

### Variables Simples con Defaults
```handlebars
{{FRAMEWORK || React}}
```
Si FRAMEWORK no está definido, usa "React" como default.

### Variables Condicionales
```handlebars
{{#if LANGUAGE}}, focusing on {{LANGUAGE}}{{/if}}
```
Solo muestra el texto si LANGUAGE está definido.

### Comparaciones
```handlebars
{{#if (eq FRAMEWORK "React")}}
// Código específico para React
{{else if (eq FRAMEWORK "Vue")}}
// Código específico para Vue
{{else}}
// Código genérico
{{/if}}
```

### Variables en Nombres de Archivos
```handlebars
setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}
```

## Configuración del Proyecto

### Opción 1: Archivo .copilot-instructions
Crea un archivo `.copilot-instructions` en la raíz del proyecto:
```json
{
  "variables": {
    "FRAMEWORK": "React",
    "LANGUAGE": "TypeScript",
    "TEST_FRAMEWORK": "Jest",
    "TESTING_LIBRARY": "React Testing Library"
  }
}
```

### Opción 2: En package.json
```json
{
  "copilot": {
    "instructions": {
      "FRAMEWORK": "Vue",
      "LANGUAGE": "JavaScript",
      "TEST_FRAMEWORK": "Vitest"
    }
  }
}
```

### Opción 3: Detección Automática
GitHub Copilot puede inferir automáticamente algunas variables basándose en:
- **package.json**: Dependencias instaladas
- **Archivos de configuración**: jest.config.js, vitest.config.ts, etc.
- **Estructura del proyecto**: Tipos de archivos presentes

## Beneficios de este Enfoque

1. **Un solo archivo de instrucciones** para múltiples tecnologías
2. **Mantenimiento centralizado** de mejores prácticas
3. **Consistencia** entre proyectos
4. **Flexibilidad** para diferentes stacks tecnológicos
5. **Reutilización** de conocimiento y patrones

## Ejemplo de Uso en Equipos

Tu equipo puede tener:
- **1 archivo base**: `instruccions.instructions.md` (parametrizado)
- **Múltiples configuraciones** según proyectos:
  - React + TypeScript + Jest
  - Vue + JavaScript + Vitest  
  - Angular + TypeScript + Jasmine

Cada desarrollador configura sus variables según el proyecto en el que trabaja, pero todos siguen las mismas mejores prácticas base.