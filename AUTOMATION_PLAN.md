# Plan de Automatización para loDataExtractor

## Resumen Ejecutivo

Este documento presenta un plan detallado para implementar la automatización completa del proceso de extracción de datos del juego Last Oasis, incluyendo:

1. **Extracción automática de datos** directamente desde los archivos del juego sin intervención manual
2. **Detección automática de actualizaciones** del juego en Steam para activar el proceso de extracción
3. **Automatización del flujo de trabajo** completo desde la detección hasta la publicación

## Análisis del Estado Actual

### Proceso Actual
- **Manual**: Requiere usar herramientas como FModel para extraer archivos JSON del juego
- **Dependiente**: Necesita intervención humana para detectar actualizaciones
- **Limitado**: Solo procesa archivos ya extraídos manualmente

### Estructura de Datos Actual
- Procesa archivos de las carpetas: `Content/Mist/Data/` y `Content/Localization/Game`
- Genera archivos JSON estructurados en `exported/`
- Maneja elementos, criaturas, tablas de loot, tecnologías y traducciones

## Objetivos del Plan

### Objetivo Principal
Automatizar completamente el proceso de extracción de datos del juego Last Oasis, priorizando la capacidad de extraer datos directamente del juego.

### Objetivos Específicos (Por Prioridad)
1. **PRIORIDAD ALTA**: Eliminar la necesidad de extracción manual de archivos
2. **PRIORIDAD ALTA**: Crear scripts para automatizar la extracción de archivos PAK del juego
3. **PRIORIDAD MEDIA**: Detectar automáticamente actualizaciones del juego en Steam
4. **PRIORIDAD BAJA**: Ejecutar automáticamente el proceso de extracción tras detectar actualizaciones

## Arquitectura de la Solución

### Componentes Principales (Por Prioridad de Implementación)

#### 1. Extractor Automático de Archivos (PRIORIDAD ALTA)
- **Función**: Extraer archivos PAK del juego automáticamente sin intervención manual
- **Tecnología**: SteamCMD + UnrealPak + Scripts personalizados
- **Activación**: Manual o programada

#### 2. Procesador de Datos Mejorado (PRIORIDAD ALTA)
- **Función**: Procesar archivos extraídos con mejor manejo de errores
- **Tecnología**: Node.js (código actual mejorado)
- **Mejoras**: Logging detallado, validación de datos, recuperación de errores

#### 3. Monitor de Actualizaciones de Steam (PRIORIDAD MEDIA)
- **Función**: Detectar cuando Last Oasis se actualiza en Steam
- **Tecnología**: Steam Web API + Node.js
- **Frecuencia**: Verificación cada 15-30 minutos

#### 4. Sistema de Notificaciones (PRIORIDAD BAJA)
- **Función**: Notificar sobre el estado del proceso
- **Tecnología**: Webhooks, email, o API de notificaciones
- **Casos**: Éxito, errores, actualizaciones detectadas

## Implementación Detallada

### Fase 1: Extracción Automática de Archivos (PRIORIDAD ALTA)

#### 1.1 Instalación y Configuración de SteamCMD
- **Descarga automática**: Script para descargar SteamCMD si no existe
- **Configuración**: Scripts de login anónimo para Last Oasis
- **Actualización**: Comando para descargar/actualizar el juego

#### 1.2 Extracción de Archivos PAK
```bash
# Comando SteamCMD para descargar Last Oasis
steamcmd +login anonymous +app_update 903950 validate +quit
```

#### 1.3 Procesamiento de Archivos PAK
- **Herramientas**: UnrealPak.exe o herramientas de terceros como FModel <mcreference link="https://github.com/allcoolthingsatoneplace/UnrealPakTool" index="1">1</mcreference>
- **Extracción**: Scripts automatizados para extraer contenido de archivos PAK <mcreference link="https://ikskoks.pl/tutorial-extracting-data-from-unreal-engine-pak-files-using-unrealpak/" index="4">4</mcreference>
- **Filtrado**: Solo extraer carpetas necesarias (`Content/Mist/Data/`, `Content/Localization/Game`)

#### 1.4 Manejo de Encriptación
- **Detección**: Verificar si los archivos PAK están encriptados
- **Claves AES**: Implementar extracción de claves si es necesario <mcreference link="https://github.com/Cracko298/UE4-AES-Key-Extracting-Guide" index="2">2</mcreference>
- **Fallback**: Mantener método manual como respaldo

#### 1.5 Script de Extracción Independiente
```javascript
// Nuevo: automation/extractGameData.js
class GameDataExtractor {
    async extractData() {
        try {
            await this.downloadGameFiles();
            await this.extractPakFiles();
            await this.processExtractedData();
            console.log('✅ Extracción completada exitosamente');
        } catch (error) {
            console.error('❌ Error en extracción:', error);
        }
    }
}
```

### Fase 2: Mejoras al Sistema de Procesamiento (PRIORIDAD ALTA)

#### 2.1 Mejoras en el Procesamiento
```javascript
// Mejorado: services/automatedProcessor.js
class AutomatedProcessor {
    async processGameData() {
        try {
            await this.validateExtractedFiles();
            await this.processDataFiles();
            await this.exportProcessedData();
            await this.generateReports();
        } catch (error) {
            await this.handleProcessingError(error);
        }
    }
}
```

#### 2.2 Sistema de Logging Mejorado
- **Logs detallados**: Registro de cada paso del proceso
- **Niveles**: Error, Warning, Info, Debug
- **Rotación**: Archivos de log con rotación automática
- **Validación**: Verificación de integridad de datos

#### 2.3 Manejo de Errores Robusto
- **Reintentos**: Sistema de reintentos para operaciones fallidas
- **Validación**: Verificación de archivos extraídos antes del procesamiento
- **Recuperación**: Capacidad de continuar desde el último punto exitoso

### Fase 3: Detección de Actualizaciones de Steam (PRIORIDAD MEDIA)

#### 3.1 Configuración de Steam Web API
```javascript
// Nuevo servicio: services/steamMonitor.js
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const LAST_OASIS_APP_ID = 903950; // App ID de Last Oasis
```

#### 3.2 Funcionalidades a Implementar
- **Verificación de última actualización**: Usar Steam Web API para obtener `last_updated`
- **Almacenamiento de estado**: Base de datos local o archivo JSON para tracking
- **Comparación de versiones**: Detectar cambios en buildid o last_updated
- **Programación**: Cron job o scheduler para verificaciones periódicas

#### 3.3 APIs de Steam a Utilizar
- `ISteamApps/GetAppList/v2/` - Para confirmar App ID <mcreference link="https://developer.valvesoftware.com/wiki/Steam_Web_API" index="1">1</mcreference>
- `ISteamNews/GetNewsForApp/v0002/` - Para noticias de actualizaciones <mcreference link="https://developer.valvesoftware.com/wiki/Steam_Web_API" index="1">1</mcreference>
- Store API: `store.steampowered.com/api/appdetails?appids=903950` - Para detalles de la app <mcreference link="https://stackoverflow.com/questions/46330864/steam-api-all-games" index="2">2</mcreference>

### Fase 4: Automatización del Flujo de Trabajo (PRIORIDAD BAJA)

#### 4.1 Orquestador Principal
```javascript
// Nuevo: services/orchestrator.js
class GameUpdateOrchestrator {
    async run() {
        // Primero: Siempre intentar extraer datos
        await this.automatedProcessor.processGameUpdate();
        
        // Opcional: Verificar actualizaciones para futuras ejecuciones
        const hasUpdate = await this.steamMonitor.checkForUpdates();
        if (hasUpdate) {
            await this.scheduleNextExtraction();
        }
    }
}
```

#### 4.2 Programación de Tareas
- **Extracción manual**: Comando directo para extraer datos
- **Extracción programada**: Cron jobs para ejecución automática
- **Triggers**: Activación manual para casos especiales

## Estructura de Archivos Propuesta

```
loDataExtractor/
├── automation/
│   ├── steamcmd/              # SteamCMD y scripts
│   ├── unrealpak/             # Herramientas de extracción PAK
│   └── scripts/               # Scripts de automatización
├── services/
│   ├── steamMonitor.js        # Monitor de actualizaciones Steam
│   ├── gameExtractor.js       # Extractor automático de archivos
│   ├── automatedProcessor.js  # Procesador automatizado
│   └── orchestrator.js        # Orquestador principal
├── config/
│   ├── steam.json            # Configuración Steam API
│   ├── extraction.json       # Configuración de extracción
│   └── automation.json       # Configuración de automatización
├── logs/                     # Archivos de log
├── temp/                     # Archivos temporales
└── docker/                   # Configuración Docker
```

## Cronograma de Implementación

### Semana 1-2: Configuración Base y Extracción Automática (PRIORIDAD ALTA)
- [ ] Investigar y configurar SteamCMD
- [ ] Configurar herramientas de extracción PAK (UnrealPak, FModel)
- [ ] Crear estructura de proyecto para automatización
- [ ] Implementar script básico de descarga del juego

### Semana 3-4: Desarrollo del Extractor Automático (PRIORIDAD ALTA)
- [ ] Implementar `gameExtractor.js`
- [ ] Crear scripts de SteamCMD automatizados
- [ ] Implementar extracción de archivos PAK
- [ ] Manejar casos de encriptación y errores

### Semana 5-6: Mejoras al Sistema de Procesamiento (PRIORIDAD ALTA)
- [ ] Mejorar `automatedProcessor.js` con validación de datos
- [ ] Implementar sistema de logging detallado
- [ ] Crear manejo robusto de errores y recuperación
- [ ] Pruebas integrales del sistema de extracción

### Semana 7-8: Desarrollo del Monitor Steam (PRIORIDAD MEDIA)
- [ ] Configurar Steam Web API y obtener claves
- [ ] Implementar `steamMonitor.js`
- [ ] Crear sistema de almacenamiento de estado
- [ ] Implementar verificación de actualizaciones

### Semana 9-10: Integración y Automatización (PRIORIDAD MEDIA)
- [ ] Implementar `orchestrator.js` con nueva priorización
- [ ] Configurar programación de tareas (manual y automática)
- [ ] Crear scripts de gestión y utilidades
- [ ] Implementar sistema básico de notificaciones

### Semana 11-12: Optimización y Despliegue (PRIORIDAD BAJA)
- [ ] Optimización de rendimiento del sistema completo
- [ ] Configurar containerización Docker (opcional)
- [ ] Crear workflows de CI/CD (opcional)
- [ ] Documentación completa y despliegue

## Requisitos Técnicos

### Software Necesario
- **Node.js** (v16+)
- **SteamCMD**
- **UnrealPak** o herramientas equivalentes
- **Docker** (opcional, recomendado)
- **Git** para control de versiones

### APIs y Servicios
- **Steam Web API Key** (gratuita)
- **Servidor** para ejecutar el sistema 24/7
- **Almacenamiento** para archivos temporales (~10GB)
- **Servicio de notificaciones** (email, Slack, Discord, etc.)

### Dependencias de Node.js
```json
{
  "dependencies": {
    "axios": "^1.12.0",
    "node-cron": "^3.0.0",
    "winston": "^3.8.0",
    "fs-extra": "^10.1.0",
    "child_process": "built-in"
  }
}
```

## Consideraciones de Seguridad

### Claves y Credenciales
- **Variables de entorno**: Almacenar claves API de forma segura
- **Encriptación**: Proteger claves AES si son necesarias
- **Acceso limitado**: Principio de menor privilegio

### Archivos del Juego
- **Términos de servicio**: Verificar cumplimiento con ToS de Steam/Last Oasis
- **Uso legítimo**: Solo para propósitos de información pública
- **Limpieza**: Eliminar archivos temporales después del procesamiento

## Monitoreo y Mantenimiento

### Métricas a Monitorear
- **Tiempo de ejecución** del proceso completo
- **Tasa de éxito** de las extracciones
- **Frecuencia de actualizaciones** del juego
- **Uso de recursos** del sistema

### Mantenimiento Regular
- **Actualización de herramientas**: Mantener SteamCMD y UnrealPak actualizados
- **Limpieza de logs**: Rotación y limpieza automática
- **Verificación de APIs**: Monitorear cambios en Steam Web API
- **Backup**: Respaldo regular de configuraciones y datos

## Riesgos y Mitigaciones

### Riesgos Técnicos
- **Cambios en formato PAK**: Mitigación con múltiples herramientas de extracción
- **Encriptación nueva**: Mantener herramientas de descifrado actualizadas
- **Cambios en Steam API**: Monitoreo de documentación oficial

### Riesgos Operacionales
- **Fallo del servidor**: Implementar redundancia y monitoreo
- **Límites de API**: Respetar rate limits y implementar backoff
- **Actualizaciones frecuentes**: Optimizar para manejar múltiples actualizaciones

## Conclusión

Este plan proporciona una hoja de ruta completa para automatizar el proceso de extracción de datos de Last Oasis. La implementación por fases permite un desarrollo incremental y la validación continua del sistema.

### Beneficios Esperados
- **95% reducción** en trabajo manual de extracción
- **Capacidad de extracción independiente** sin necesidad de herramientas externas
- **Scripts reutilizables** para futuras actualizaciones del juego
- **Mayor confiabilidad** con manejo automático de errores
- **Flexibilidad** para ejecutar extracción cuando sea necesario

### Próximos Pasos Inmediatos
1. **Configurar SteamCMD** y herramientas de extracción PAK
2. **Crear script básico** de extracción automática
3. **Probar extracción** con la versión actual del juego
4. **Mejorar sistema de procesamiento** con mejor manejo de errores
5. **Implementar detección de actualizaciones** como funcionalidad adicional

---

*Este documento será actualizado conforme avance la implementación y se identifiquen nuevos requisitos o mejoras.*