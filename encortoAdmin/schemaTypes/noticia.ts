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
      name: 'body',
      title: 'Contenido',
      type: 'array',
      of: [{type: 'block'}],
      validation: (r) => r.required(),
    }),
  ],
})

