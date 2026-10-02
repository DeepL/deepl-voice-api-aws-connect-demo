// Lambda with Function URL enabled
// Returns Voice API languages as [{ language, name }]:
//   type=source → languages that support transcription (usable as voice input)
//   type=target → languages that support translated speech (usable as voice output)
// include=beta is required: translated_speech is reported with status "beta" and is omitted without it.
// include=external adds languages whose transcription / translated speech is provided by a DeepL service partner.
export const handler = async (event) => {
  const deeplApiKey = process.env.DEEPL_API_KEY;
  console.log(event)

  let body;
  if (typeof event.body === 'string') {
    body = JSON.parse(event.body);
  } else {
    body = event.body;
  }
  const type = body?.type || 'source';

  if (type !== 'source' && type !== 'target') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid type parameter. Must be "source" or "target".' })
    };
  }

  try {
    const response = await fetch('https://api.deepl.com/v3/languages?resource=voice&include=beta&include=external', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`DeepL response status: ${response.status}, body: ${JSON.stringify(data)}`);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: `DeepL API error: ${response.status}`, deepl: data })
      };
    }

    const languages = data
      .filter(lang => type === 'source'
        ? lang.usable_as_source && lang.features?.transcription
        : lang.usable_as_target && lang.features?.translated_speech)
      .map(lang => ({ language: lang.lang, name: lang.name }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(languages)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
