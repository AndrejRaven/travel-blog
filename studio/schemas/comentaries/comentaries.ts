export default {
  name: 'comment',
  type: 'document',
  title: 'Komentarz',
  fields: [
    {
      name: 'author',
      title: 'Autor',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Imię i nazwisko',
          type: 'string',
          validation: (Rule: any) => Rule.required().min(2).max(100),
        },
        {
          name: 'email',
          title: 'Email',
          type: 'string',
          validation: (Rule: any) => Rule.required().email(),
        },
      ],
    },
    {
      name: 'content',
      title: 'Treść komentarza',
      type: 'text',
      rows: 4,
      validation: (Rule: any) => Rule.required().min(10).max(1000),
    },
    {
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'parentComment',
      title: 'Komentarz nadrzędny',
      type: 'reference',
      to: [{ type: 'comment' }],
      description: 'Opcjonalnie - dla odpowiedzi na komentarz',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Oczekujący', value: 'pending' },
          { title: 'Zatwierdzony', value: 'approved' },
          { title: 'Odrzucony', value: 'rejected' },
          { title: 'Spam', value: 'spam' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    },
    {
      name: 'ipAddress',
      title: 'Adres IP',
      type: 'string',
      description: 'Automatycznie zapisywany adres IP autora',
    },
    {
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Informacje o przeglądarce autora',
    },
    {
      name: 'createdAt',
      title: 'Data utworzenia',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'updatedAt',
      title: 'Data aktualizacji',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'author.name',
      subtitle: 'content',
      status: 'status',
      createdAt: 'createdAt',
    },
    prepare(selection: any) {
      const { title, subtitle, status, createdAt } = selection;
      const statusColors = {
        pending: '🟡',
        approved: '🟢',
        rejected: '🔴',
        spam: '🚫',
      };
      
      const date = createdAt ? new Date(createdAt).toLocaleDateString('pl-PL') : '';
      const statusIcon = statusColors[status as keyof typeof statusColors] || '❓';
      
      return {
        title: `${statusIcon} ${title || 'Brak nazwy'}`,
        subtitle: `${subtitle?.substring(0, 50)}... | ${date}`,
      };
    },
  },
  orderings: [
    {
      title: 'Data utworzenia (najnowsze)',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Data utworzenia (najstarsze)',
      name: 'createdAtAsc',
      by: [{ field: 'createdAt', direction: 'asc' }],
    },
    {
      title: 'Status',
      name: 'status',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
}
