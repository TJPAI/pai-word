/**
 * Conservative pre-E5 input validity gate. No model score or test label used.
 * INVALID_INPUT is not the same as OUT_OF_TAXONOMY.
 * Keep valid domain queries for semantic retrieval and separate abstention.
 */
const latin=/[A-Za-z]/u, han=/[\u3400-\u9fff]/u;
const hangul=/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/u;
const emoji=/\p{Extended_Pictographic}/u;
const digitsOnly=/^[0-9\s\p{P}\p{S}]+$/u;
const punctuationOnly=/^[\p{P}\p{S}\s]+$/u;
const supportedContent=/[A-Za-z\u3400-\u9fff]/u;
const mixedToken=/[A-Za-z]+(?:['’-][A-Za-z]+)*|[\u3400-\u9fff]|[0-9]|[^\s]/gu;
export function checkQuery(input) {
 if(typeof input!=='string')return {status:'INVALID_INPUT',reason:'NON_STRING'};
 const text=input.normalize('NFKC').trim();
 if(!text)return {status:'INVALID_INPUT',reason:'EMPTY'};
 if(text.length>512)return {status:'INVALID_INPUT',reason:'TOO_LONG'};
 const units=(text.match(mixedToken)||[]).length;
 if(units>20)return {status:'INVALID_INPUT',reason:'OVER_20_UNITS'};
 if(punctuationOnly.test(text))return {status:'INVALID_INPUT',reason:'PUNCTUATION_OR_SYMBOLS_ONLY'};
 if(digitsOnly.test(text))return {status:'INVALID_INPUT',reason:'DIGITS_ONLY'};
 if(!supportedContent.test(text)){
  if(hangul.test(text))return {status:'UNSUPPORTED_LANGUAGE',reason:'HANGUL_WITHOUT_ZH_EN'};
  if(emoji.test(text))return {status:'INVALID_INPUT',reason:'EMOJI_ONLY'};
  return {status:'UNSUPPORTED_LANGUAGE',reason:'NO_ZH_EN_TEXT'};
 }
 // Keep short legitimate queries ('AI', 'C', '学', '税') rather than guessing intent.
 return {status:'PASS',reason:'HAS_ZH_EN_TEXT',normalized:text,units};
}
