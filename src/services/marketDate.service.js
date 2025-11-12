import axios from 'axios'; 

const BCB_API_URLS = {
   SELIC: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json',
   CDI: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
};

const cache = {
   rates: null,
   lastFetch: 0,
};

const CACHE_DURATION = 4 * 60 * 60 * 1000;

/**
 * Busca a taxa Selic (meta) do BCB.
 * @returns {Promise<number>} A taxa Selic anual (ex: 10.5)
 */
async function fetchSelic() {
   try {
      const response = await axios.get(BCB_API_URLS.SELIC);
      const valor = parseFloat(response.data[0].valor);

      if (isNaN(valor)) throw new Error('Valor inválido da Selic');
      return valor;

   } catch (error) {
      console.error('Erro ao buscar Selic do BCB:', error.message);
      return null; 
   }
}

/**
 * Busca a taxa CDI (DI-CETIP) do BCB.
 * @returns {Promise<number>} A taxa CDI diária (ex: 0.040)
 */
async function fetchCDI() {
   try {
      const response = await axios.get(BCB_API_URLS.CDI);
      const valor = parseFloat(response.data[0].valor);

      if (isNaN(valor)) throw new Error('Valor inválido do CDI');
      return valor;

   } catch (error) {
      console.error('Erro ao buscar CDI do BCB:', error.message);
      return null; 
   }
}

/**
 * Obtém as taxas de mercado (Selic e CDI), usando o cache.
 * @returns {Promise<Object>} Objeto com { selic, cdi }
 */
export const getMarketRates = async () => {
   const now = Date.now();

   if (cache.rates && (now - cache.lastFetch < CACHE_DURATION)) {
      console.log('Usando taxas de mercado do cache');
      return cache.rates;
   }

   console.log('Buscando novas taxas de mercado (BCB)...');

   const [selic, cdi] = await Promise.all([
      fetchSelic(),
      fetchCDI()
   ]);

   if (!selic || !cdi) {
      console.warn('Falha ao buscar novas taxas. Usando cache antigo (se disponível).');
      return cache.rates || { selic: null, cdi: null };
   }

   cache.rates = { 
      selic: selic, 
      cdi: cdi      
   };
   cache.lastFetch = now;

   return cache.rates;
};