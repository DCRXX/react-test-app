interface Chat {
  id: string
  phone: string
  name?: string
}

export const normalizePhone = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }
    if (digits.length === 10) {
        digits = '7' + digits;
    }

    return digits;
};

const chatIdToPhone = (chatId: string): string => {
    const raw = chatId.split('@')[0];
    return normalizePhone(raw);
};

export const upsertChat = (
  prev: Chat[],
  chatId: string,
  phoneRaw: string,
  name?: string,
): Chat[] => {
  const phone = normalizePhone(String(phoneRaw));

  const match = (c: Chat) =>
    c.phone === phone || chatIdToPhone(c.id) === phone;

  const existing = prev.find(match);
  const filtered = prev.filter((c) => !match(c));

  if (existing) {
    return [
      ...filtered,
      { ...existing, id: chatId, phone, name: name || existing.name },
    ];
  }

  return [...prev, { id: chatId, phone, name }];
};