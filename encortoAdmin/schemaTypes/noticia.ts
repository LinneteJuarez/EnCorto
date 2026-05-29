import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'noticia',
  title: 'Noticia',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Fecha',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          {title: 'Global', value: 'global'},
          {title: 'Política', value: 'politica'},
          {title: 'Economía', value: 'economia'},
          {title: 'Tec', value: 'tec'},
          {title: 'Deportes', value: 'deportes'},
          {title: 'Espectáculos', value: 'espectaculos'},
          {title: 'Felices', value: 'felices'},
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Imagen',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'porQueImporta',
      title: '¿Por qué importa?',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'queSigue',
      title: '¿Qué sigue?',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'body',
      title: 'Contenido extendido (opcional)',
      description: 'Texto adicional al expandir la tarjeta. Los subtítulos principales van arriba.',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
})

