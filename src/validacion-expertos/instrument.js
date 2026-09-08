(function (root) {
  'use strict';
  const instrument = {
  "version": "2.1.0",
  "title": "Validación de expertos",
  "researcherEmail": "luis.gonzalezc@urjc.es",
  "purpose": "Identificar brechas de evidencia y de capacidad de ejecución para priorizar el siguiente hito de una startup en fase temprana.",
  "population": "Startups desde la exploración de una idea hasta las primeras señales de repetición comercial. La pertinencia de cada pregunta depende de la fase y del modelo de negocio.",
  "source": "Instrumento V2.1 aprobado el 8 de septiembre de 2026. Banco de 23 ítems; pendiente de validación experta. La matriz de fuentes distingue referencias verificadas y localizadores pendientes.",
  "expertCriteria": {
    "relevance": "Relevancia de 1 a 4; obligatoria al enviar, salvo omisión explícita.",
    "usability": "Claridad y respuestas, de 1 a 4; opcional para todos los ítems, según la decisión aprobada para V2."
  },
  "dimensions": [
    {
      "id": "D1",
      "short": "Equipo",
      "name": "Equipo y gobernanza",
      "desc": "Capacidades, aprendizaje, disponibilidad y acuerdos para alcanzar el siguiente objetivo."
    },
    {
      "id": "D2",
      "short": "Mercado",
      "name": "Problema y mercado",
      "desc": "Segmento prioritario, evidencia del problema, mercado accesible y condiciones de adopción."
    },
    {
      "id": "D3",
      "short": "Propuesta de valor",
      "name": "Propuesta de valor y modelo de negocio",
      "desc": "Ventaja percibida, hipótesis de monetización y resultados de las pruebas de la solución."
    },
    {
      "id": "D4",
      "short": "Evidencia comercial",
      "name": "Evidencia comercial (tracción y go-to-market)",
      "desc": "Compromisos verificables y pruebas de adquisición de clientes en el segmento elegido. Mide la evidencia obtenida, no el plan comercial previsto."
    },
    {
      "id": "D5",
      "short": "Finanzas",
      "name": "Evidencia financiera",
      "desc": "Control de caja, previsión, recursos para el siguiente hito y economía del cliente cuando sea aplicable."
    },
    {
      "id": "D6",
      "short": "Recursos y confianza",
      "name": "Recursos estratégicos y legitimidad",
      "desc": "Relaciones, legitimidad y evidencias de confianza que facilitan recursos, acceso al mercado o acuerdos. La legitimidad es el reconocimiento externo que hace que un cliente, socio o inversor se atreva a trabajar con una empresa nueva."
    }
  ],
  "items": [
    {
      "id": "T1",
      "dim": "D1",
      "q": "¿El equipo cubre los perfiles necesarios para crear la solución y venderla?",
      "note": "Revisa si están cubiertas las funciones de producto y ventas, además de las que exija el modelo. Los perfiles pueden estar en el equipo o colaborar de forma estable.",
      "levels": [
        "No se ha analizado qué perfiles exige este modelo de negocio.",
        "Se sabe qué perfiles faltan, pero su cobertura todavía no está asegurada.",
        "Los perfiles críticos están cubiertos y hay un responsable identificado para cada uno.",
        "El equipo ya ha alcanzado objetivos similares y cuenta de forma estable con los perfiles externos que necesita."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "T2",
      "dim": "D1",
      "q": "¿El equipo dispone de conocimiento directo del cliente, sector o problema para tomar decisiones?",
      "note": "El conocimiento puede venir de experiencia, investigación o colaboración continua con personas del sector. Incluye quién compra, cómo compra y cuánto tarda en decidir.",
      "levels": [
        "Las decisiones se apoyan principalmente en supuestos sin contraste directo.",
        "Hay conocimiento indirecto o contactos puntuales, con lagunas relevantes.",
        "El equipo dispone de conocimiento directo sobre el cliente y su contexto.",
        "Ese conocimiento ha permitido corregir supuestos y fundamentar decisiones concretas."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "T4",
      "dim": "D1",
      "q": "¿La disponibilidad de los fundadores permite atender las prioridades del proyecto?",
      "note": "Compara la disponibilidad real de los fundadores con el tiempo que exigen las prioridades de las últimas cuatro semanas. Puede comprobarse con agendas o registros de dedicación.",
      "levels": [
        "La disponibilidad de los fundadores no permite atender las prioridades del periodo.",
        "La disponibilidad de los fundadores permite atender solo algunas prioridades del periodo.",
        "La disponibilidad de los fundadores permite atender todas las prioridades del periodo.",
        "La disponibilidad de los fundadores permite atender las prioridades incluso en semanas de mayor carga."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "T5",
      "dim": "D1",
      "q": "¿Están claros y documentados los acuerdos necesarios para tomar decisiones y distribuir responsabilidades?",
      "note": "Revisa si están claras las responsabilidades y cómo se toman decisiones. Puede constar en un pacto de socios o en acuerdos escritos con colaboradores.",
      "levels": [
        "No están claros los responsables ni cómo se toman decisiones importantes.",
        "Existen acuerdos verbales o parciales sobre responsabilidades y decisiones.",
        "Los acuerdos relevantes para la estructura actual están documentados y son conocidos.",
        "Se revisan ante cambios del equipo y contemplan cómo resolver desacuerdos, ausencias o salidas."
      ],
      "applicability": {
        "field": "hasDecisionAgreements",
        "question": "Hay socios o colaboradores con quienes acordar decisiones.",
        "exclusion": "No existen socios ni colaboradores con quienes acordar decisiones."
      },
      "conditional": "No aplica todavía: No existen socios ni colaboradores con quienes acordar decisiones. Se registra aparte y se excluye del denominador; nunca puntúa 0."
    },
    {
      "id": "T6",
      "dim": "D1",
      "q": "¿La estructura de propiedad permite decidir con agilidad y no compromete etapas futuras?",
      "note": "Comprueba si el reparto de participaciones permite decidir sin bloqueos y deja margen para incorporar personas o recibir inversión.",
      "conditional": "No aplica todavía: No existe estructura de participaciones ni compromisos de reparto. Se registra aparte y se excluye del denominador; nunca puntúa 0.",
      "levels": [
        "No se ha revisado cómo afecta el reparto a la toma de decisiones.",
        "Se conoce el reparto, pero no se han valorado sus efectos sobre decisiones o incorporaciones futuras.",
        "El reparto permite decidir sin bloqueos y no hay participaciones relevantes en manos de personas ajenas a la actividad.",
        "Existen mecanismos previstos para salidas, incorporaciones y desbloqueo de decisiones, y se revisan cuando cambia el equipo."
      ],
      "applicability": {
        "field": "hasOwnership",
        "question": "Existe una estructura de participaciones o compromisos de reparto que analizar.",
        "exclusion": "No existe estructura de participaciones ni compromisos de reparto."
      }
    },
    {
      "id": "PM1",
      "dim": "D2",
      "q": "¿Está definido el segmento prioritario al que se dirigen las pruebas y acciones comerciales?",
      "note": "Cuando sean diferentes, distingue usuario, comprador y pagador.",
      "levels": [
        "El mercado objetivo es amplio y no hay un segmento concreto.",
        "Se han identificado segmentos posibles, sin prioridad justificada.",
        "Existe un segmento prioritario descrito con criterios que permiten identificar clientes.",
        "Las pruebas y acciones se concentran en ese segmento y la elección se revisa con evidencia."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "PM2",
      "dim": "D2",
      "q": "¿Hay evidencia directa de que el problema es suficientemente importante para que el cliente actúe?",
      "note": "La importancia puede provenir del coste, frecuencia, riesgo o urgencia. Distingue un problema que ya cuesta dinero o tiempo, y que el cliente intenta resolver, de una mejora que simplemente estaría bien tener. Un problema infrecuente también puede ser relevante.",
      "levels": [
        "No hay evidencia directa del problema.",
        "Hay opiniones o interés declarado, sin ejemplos concretos de sus consecuencias.",
        "Se ha hablado directamente con personas del segmento, también fuera del círculo cercano, y describen casos y consecuencias concretas.",
        "En distintos casos se observan gasto, tiempo o soluciones improvisadas dedicados hoy a resolverlo con las alternativas disponibles."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "PM3",
      "dim": "D2",
      "q": "¿La estimación del mercado accesible se apoya en supuestos y datos contrastables?",
      "note": "La estimación debe construirse de abajo arriba: desde clientes identificables, precio y frecuencia de compra. Partir de una cifra global del sector y recortarla con porcentajes sirve solo como contraste. Valora la trazabilidad y los límites de los supuestos.",
      "levels": [
        "No existe una estimación útil del mercado accesible.",
        "Hay una cifra general, sin supuestos claros sobre clientes o acceso.",
        "La estimación explicita clientes alcanzables, precios o frecuencia y restricciones de acceso.",
        "Los supuestos se contrastan con datos del segmento y se conoce la estructura competitiva: si el mercado está dominado por pocos actores o fragmentado, y qué barreras de entrada existen."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "PM4",
      "dim": "D2",
      "q": "¿Puede explicarse, con datos, por qué este es el momento y qué facilita o dificulta hoy la adopción?",
      "note": "Incluye hábitos, costes de cambio, tecnología, regulación o ciclos de compra. Un mercado estable puede ser adecuado; no se exige un sector en auge.",
      "levels": [
        "No se ha analizado qué hace que este sea el momento ni qué condiciona la adopción.",
        "Se mencionan facilitadores o barreras, principalmente por intuición.",
        "Se identifica algún cambio verificable (regulatorio, tecnológico, de coste, de hábito o de canal) y las barreras se han contrastado con personas o datos del segmento.",
        "Las pruebas de adopción permiten ajustar la propuesta, el momento o la vía de entrada, y se sostiene con datos por qué no antes."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "VB1",
      "dim": "D3",
      "q": "¿El cliente reconoce una ventaja concreta frente a las alternativas que utiliza hoy?",
      "note": "Incluye competidores, sustitutos, soluciones improvisadas (workarounds) y la opción de no hacer nada.",
      "levels": [
        "No se conocen suficientemente las alternativas actuales.",
        "La ventaja propuesta es principalmente una hipótesis interna.",
        "Personas del segmento reconocen una ventaja específica frente a sus alternativas.",
        "Esa ventaja explica decisiones observadas de uso, elección o compra en distintos casos."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "VB2",
      "dim": "D3",
      "q": "¿Está contrastado quién pagaría, por qué concepto y bajo qué condiciones?",
      "note": "Evalúa la lógica de monetización. Los pagos y compromisos reales se examinan específicamente en C1.",
      "levels": [
        "No se identifica con claridad quién pagaría ni por qué concepto.",
        "Existe una hipótesis de pagador, precio y forma de cobro.",
        "La hipótesis se ha contrastado con posibles pagadores y se conocen sus objeciones.",
        "Las pruebas de oferta o negociación han permitido ajustar precio y condiciones, y el precio es coherente con el coste y la duración del ciclo de venta."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "VB3",
      "dim": "D3",
      "q": "¿Las pruebas con usuarios reales muestran que la solución produce el resultado que promete?",
      "applicabilityNote": "Si el uso es puntual, no se exige repetición: valora si el resultado se confirma en distintos casos. No haber realizado pruebas se refleja en el nivel 0; no equivale a «No aplica».",
      "note": "El resultado puede ser ahorro de tiempo, reducción de errores u otro beneficio relevante. Adapta continuidad, repetición o retención al modelo.",
      "levels": [
        "La solución todavía no se ha probado con usuarios del segmento.",
        "Se ha mostrado un concepto o demo, sin observar el resultado de uso.",
        "Usuarios del segmento han probado la solución y se ha observado el resultado obtenido.",
        "El resultado se confirma en distintos casos y hay continuidad o repetición de uso cuando corresponde."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "VB4",
      "dim": "D3",
      "q": "¿Qué evidencia tienes sobre las horas necesarias para aumentar los ingresos?",
      "note": "Se compara el ingreso de entregas equivalentes con las horas totales del equipo. Cuentan registros de pedidos y horas, separando cambios de precios.",
      "levels": [
        "La relación entre ingresos y horas de trabajo no se ha estimado.",
        "La relación entre ingresos y horas de trabajo se estima sin registros de entregas.",
        "La relación entre ingresos y horas de trabajo se calcula con registros de entregas.",
        "La relación entre ingresos y horas de trabajo se contrasta entre periodos con distinto volumen de entregas."
      ],
      "designFields": [
        {
          "id": "hoursRevenue",
          "label": "Relación entre ingresos y horas del equipo",
          "description": "Dato no puntuado. Al aumentar las entregas, las horas crecen más, aproximadamente igual o menos que los ingresos; también puede registrarse «No se conoce». Incluye fundador, personal y colaboradores."
        }
      ],
      "sources": [
        {
          "id": "EXT-SCALE-2024",
          "citation": "What is scaling? Journal of Business Venturing 39(1), 106355 (2024).",
          "url": "https://doi.org/10.1016/j.jbusvent.2023.106355",
          "status": "Fuente conceptual externa; pertenencia a la SLR y validación de anclajes pendientes."
        }
      ],
      "applicability": {
        "field": "deliveryDefined",
        "question": "Está definida la forma de entregar el producto o servicio.",
        "exclusion": "Todavía no está definida la forma de entrega."
      },
      "conditional": "No aplica todavía: Todavía no está definida la forma de entrega. Se registra aparte y se excluye del denominador; nunca puntúa 0."
    },
    {
      "id": "C1",
      "dim": "D4",
      "q": "¿Qué compromisos comerciales has conseguido y cuáles se han repetido?",
      "note": "Un compromiso comercial implica que el cliente dedica recursos o realiza una compra. La repetición se acredita con ventas en distintos periodos, aunque los compradores sean diferentes.",
      "levels": [
        "No hay compromisos comerciales documentados.",
        "Hay interés documentado, sin recursos comprometidos.",
        "Hay compras o compromisos de recursos documentados, sin repetición comprobada.",
        "Hay compras repetidas, renovaciones o ingresos recurrentes, con registros de varios periodos."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "C2",
      "dim": "D4",
      "q": "¿Se ha probado una forma de llegar y vender al segmento prioritario?",
      "applicabilityNote": "En ciclos comerciales largos pueden utilizarse avances verificables del proceso, aunque todavía no haya ventas. No haber probado el canal es una brecha de evidencia, no un «No aplica».",
      "note": "GTM: estrategia de llegada al mercado. Valora pruebas y resultados en relación con la duración del ciclo comercial.",
      "levels": [
        "No hay una hipótesis concreta de canal o proceso comercial.",
        "Existe una hipótesis de canal, mensaje y forma de venta para el segmento.",
        "Se ha probado con clientes reales y se registran contactos, conversiones u otros resultados pertinentes.",
        "Pruebas sucesivas muestran resultados comparables y se conoce cuánto tiempo y cuánto coste requiere conseguir un cliente por ese canal."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "C3",
      "dim": "D4",
      "q": "¿Qué evidencia tienes sobre la dependencia de tu principal cliente?",
      "note": "La concentración es la parte de la facturación que aporta el cliente que más compra. Cuentan los registros de ventas y el cálculo del efecto de perder ese cliente.",
      "levels": [
        "La dependencia del principal cliente no se ha calculado.",
        "La dependencia del principal cliente se estima sin contrastarla con la facturación.",
        "La dependencia del principal cliente se calcula con la facturación del periodo.",
        "La dependencia del principal cliente se calcula y su pérdida se contrasta con cobros y compromisos."
      ],
      "designFields": [
        {
          "id": "largestCustomerShare",
          "label": "Porcentaje del principal cliente",
          "description": "Dato no puntuado, de 0 a 100, o «No se conoce». Se distingue estimación de cálculo con registros. Periodo: últimos doce meses o desde la primera venta si es más reciente; se registra su duración."
        }
      ],
      "sources": [
        {
          "id": "EXT-CONC-2016",
          "citation": "Dhaliwal, Judd, Serfling y Shaikh (2016). Customer concentration risk and the cost of equity capital. Journal of Accounting and Economics 61(1), 23–48.",
          "url": "https://doi.org/10.1016/j.jacceco.2015.03.005",
          "status": "Fuente conceptual externa; no establece los cortes ni valida estos anclajes."
        }
      ],
      "applicability": {
        "field": "hasRevenue",
        "question": "Existe facturación en el periodo de referencia.",
        "exclusion": "No existe facturación en el periodo de referencia."
      },
      "conditional": "No aplica todavía: No existe facturación en el periodo de referencia. Se registra aparte y se excluye del denominador; nunca puntúa 0."
    },
    {
      "id": "F1",
      "dim": "D5",
      "q": "¿Conoces el dinero disponible y los cobros y pagos previstos?",
      "note": "La caja es el dinero disponible para los pagos del negocio. Se revisa con los cobros y pagos previstos; si las salidas superan las entradas, se calcula cuánto tiempo puede sostenerse esa diferencia.",
      "levels": [
        "La información de caja no identifica el dinero disponible ni los principales cobros y pagos.",
        "La información de caja estima el dinero disponible y los movimientos, sin contraste con registros.",
        "La información de caja contrasta el dinero disponible y los movimientos con registros.",
        "La información de caja se actualiza según el ciclo de cobros y pagos y orienta los compromisos."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "F2",
      "dim": "D5",
      "q": "¿Existe una previsión de caja que permita anticipar las necesidades de los próximos meses?",
      "note": "Como referencia, considera los próximos seis meses o el horizonte del siguiente hito cuando resulte más adecuado.",
      "levels": [
        "No existe una previsión.",
        "Hay una estimación informal de entradas y salidas.",
        "Existe una previsión con supuestos explícitos sobre cobros, pagos y saldo de caja.",
        "Se revisa frente a los datos reales y contempla escenarios para anticipar decisiones."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "F3",
      "dim": "D5",
      "q": "¿Se conocen los recursos necesarios y su financiación para alcanzar el siguiente hito?",
      "note": "El siguiente hito es el objetivo verificable que la startup quiere alcanzar antes de dar el paso siguiente: por ejemplo, cerrar los primeros clientes de pago o completar una prueba con usuarios. Incluye recursos propios, ingresos, ayudas u otras fuentes. No se presupone la necesidad de inversión externa.",
      "levels": [
        "No está definido el siguiente hito o los recursos que requiere.",
        "Hay una estimación de recursos sin conexión suficiente con las tareas del hito.",
        "Se relacionan tareas, costes y recursos disponibles, identificando la posible brecha de financiación.",
        "Se ajustan los recursos y el plan de financiación según el avance y la evidencia obtenida."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "F4",
      "dim": "D5",
      "q": "¿Se conoce lo que cuesta conseguir y atender a un cliente y el margen que deja?",
      "note": "El coste de conseguir un cliente (CAC) y el valor que aporta a lo largo de la relación (LTV) son opciones cuando el modelo y los datos permiten estimarlos con sentido. Juzga también si está clara la distinción entre una estimación preliminar y la falta de base para estimar.",
      "conditional": "No aplica todavía: No hay base para una estimación fundamentada. Se registra aparte y se excluye del denominador; nunca puntúa 0.",
      "levels": [
        "No se han analizado los costes de adquirir y servir al cliente ni el margen que aporta.",
        "Existen estimaciones preliminares con supuestos y limitaciones identificados.",
        "Se calculan costes y margen con datos reales para un segmento o grupo de clientes comparable.",
        "Se revisan los cálculos y su incertidumbre para orientar precios, adquisición o servicio."
      ],
      "applicability": {
        "field": "hasEstimationBasis",
        "question": "Hay datos o supuestos explícitos para estimar costes y margen.",
        "exclusion": "No hay base para una estimación fundamentada."
      }
    },
    {
      "id": "F5",
      "dim": "D5",
      "q": "¿Está identificado el efecto de la financiación pública pendiente sobre tu próximo objetivo?",
      "note": "El próximo objetivo es un resultado verificable, como completar una prueba o conseguir las primeras ventas. Cuentan el presupuesto, las resoluciones y las fechas previstas de disponibilidad de los fondos.",
      "levels": [
        "El efecto de la financiación pública pendiente no se ha identificado.",
        "El efecto de la financiación pública pendiente se estima sin vincularlo al presupuesto.",
        "El efecto de la financiación pública pendiente se calcula sobre el presupuesto del próximo objetivo.",
        "El efecto de la financiación pública pendiente se calcula y existe un plan si no llega."
      ],
      "designFields": [
        {
          "id": "publicFunding",
          "label": "Programa, tipo y estado de la financiación",
          "description": "Datos no puntuados. Programa y tipo (préstamo o subvención); estado (prevista, solicitada, concedida o cobrada); recursos totales del objetivo e importe pendiente de concesión. La proporción pendiente se calcula sin duplicar ayudas para el mismo gasto. Un importe desconocido no equivale a cero."
        },
        {
          "id": "publicPrograms",
          "label": "Ejemplos de financiación pública",
          "description": "ENISA ofrece préstamos participativos; NEOTEC es un programa del CDTI. Se registran también Kit Digital y programas autonómicos, incluidas ayudas históricas. No se presupone que sus convocatorias estén abiertas. Concedida no equivale a cobrada."
        }
      ],
      "sources": [
        {
          "id": "OF-ENISA",
          "citation": "ENISA. Financiación: préstamos participativos.",
          "url": "https://www.enisa.es/servicios/financiacion/",
          "status": "Descripción oficial del programa; no valida los anclajes."
        },
        {
          "id": "OF-CDTI",
          "citation": "CDTI. Ayudas NEOTEC.",
          "url": "https://www.cdti.es/ayudas/ayudas-neotec",
          "status": "Descripción oficial del programa; no valida los anclajes."
        },
        {
          "id": "OF-KIT",
          "citation": "Red.es. Convocatorias Kit Digital.",
          "url": "https://kitdigital.red.es/convocatorias",
          "status": "Fuente oficial para identificar programas, no para afirmar que estén abiertos."
        }
      ],
      "applicability": {
        "field": "usesPublicFunding",
        "question": "El plan usa o contempla financiación pública.",
        "exclusion": "El plan no usa ni contempla financiación pública."
      },
      "conditional": "No aplica todavía: El plan no usa ni contempla financiación pública. Se registra aparte y se excluye del denominador; nunca puntúa 0."
    },
    {
      "id": "SA1",
      "dim": "D6",
      "q": "¿Las relaciones externas aportan recursos u oportunidades necesarios para el siguiente hito?",
      "note": "Valora contribuciones, no prestigio ni tamaño de la red. Incluye proveedores, clientes, comunidades, especialistas y colaboradores.",
      "levels": [
        "No se han identificado las relaciones externas necesarias.",
        "Hay contactos posibles, sin una contribución concreta acordada.",
        "Existen contribuciones verificables vinculadas a necesidades del proyecto.",
        "Las contribuciones se mantienen y facilitan avances concretos, gestionando dependencias."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    },
    {
      "id": "SA2",
      "dim": "D6",
      "q": "¿Existen evidencias de confianza adecuadas a lo que necesitan clientes o socios para colaborar?",
      "note": "Es la legitimidad de una empresa nueva: lo que hace que la otra parte se atreva a dar el paso. Pueden ser referencias, resultados de pruebas, experiencia demostrada, acreditaciones pertinentes o el aval de un cliente o institución de referencia. No se exige tener inversores ni apoyos prestigiosos.",
      "levels": [
        "No se conoce qué evidencias de confianza necesita el cliente o socio.",
        "Se conocen esas necesidades, pero solo hay afirmaciones o señales informales.",
        "Hay referencias, resultados u otras evidencias verificables pertinentes para esas necesidades.",
        "Esas evidencias han facilitado acuerdos, acceso o colaboración en casos concretos."
      ],
      "applicability": {
        "field": null,
        "question": "Se revisa en todas las rutas. La ausencia de pruebas no implica exclusión."
      }
    }
  ],
  "glossary": [
    {
      "term": "vesting",
      "label": "Vesting",
      "definition": "Adquisición progresiva de derechos sobre participaciones, sujeta a plazos o condiciones acordadas."
    }
  ],
  "schema": "expert-validation/2.1",
  "screening": [
    {
      "id": "phase",
      "label": "Fase del proyecto",
      "options": [
        "Exploración de la idea",
        "Pruebas sin ventas",
        "Primeras ventas",
        "Ventas repetidas"
      ],
      "purpose": "Contextualiza la evidencia; no asigna niveles ni oculta una falta de pruebas."
    },
    {
      "id": "market",
      "label": "Destinatario de la oferta",
      "options": [
        "Empresas u organizaciones (B2B)",
        "Particulares (B2C)",
        "Ambos"
      ],
      "purpose": "Adapta ejemplos. No determina por sí solo la duración del ciclo de venta."
    },
    {
      "id": "company",
      "label": "Sociedad constituida",
      "options": [
        "Sí",
        "No"
      ],
      "purpose": "Orienta la comprobación de propiedad, sin sustituirla."
    },
    {
      "id": "funding",
      "label": "Búsqueda de financiación externa",
      "options": [
        "No",
        "Se está considerando",
        "Se está buscando",
        "Ya está comprometida"
      ],
      "purpose": "Incluye préstamos, inversión y financiación pública. No oculta las preguntas de caja o recursos propios."
    },
    {
      "id": "founders",
      "label": "Número de fundadores",
      "options": [
        "Una persona",
        "Dos",
        "Tres o más"
      ],
      "purpose": "Adapta ejemplos de acuerdos. Un fundador único también puede trabajar con colaboradores."
    }
  ],
  "contextMetadata": [
    {
      "id": "projectMonths",
      "label": "Meses desde el inicio del proyecto",
      "unit": "meses",
      "description": "Desde la primera actividad concreta para desarrollar el proyecto; no desde su constitución. Valor 0 si empezó este mes. Dato no puntuado."
    },
    {
      "id": "lastCustomerTestWeeks",
      "label": "Semanas desde la última prueba con clientes reales",
      "unit": "semanas",
      "description": "Valor 0 para una prueba de esta semana. «Nunca se ha realizado» y «No se recuerda» son estados separados. Dato no puntuado."
    }
  ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = instrument;
  else root.ValidationInstrument = instrument;
})(globalThis);
