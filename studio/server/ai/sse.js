export async function* parseSse(stream) {
  if (!stream) throw new Error('Streaming response has no body.');
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, boundary).replace(/\r/g, '');
      buffer = buffer.slice(boundary + 2);
      const event = { event: 'message', data: '' };
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event.event = line.slice(6).trim();
        if (line.startsWith('data:')) event.data += `${line.slice(5).trim()}\n`;
      }
      event.data = event.data.trimEnd();
      if (event.data) yield event;
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    const data = buffer.split(/\r?\n/)
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())
      .join('\n');
    if (data) yield { event: 'message', data };
  }
}

