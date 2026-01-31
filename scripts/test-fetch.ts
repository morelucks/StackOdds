import { getAddressFromPrivateKey } from '@stacks/transactions';

async function test() {
    try {
        const privateKey = "4dcad13c3973c734db70ea2d88f9a838ceb4920cd65edb3a76a920d85a6eaf9a01";
        const address = getAddressFromPrivateKey(privateKey, 'mainnet');
        const apiUrl = 'https://api.hiro.so';
        const url = `${apiUrl}/v2/accounts/${address}?proof=0`;

        console.log(`Interacting from address: ${address}`);
        console.log(`Fetching from ${url}...`);

        const startTime = Date.now();
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: AbortSignal.timeout(15000)
        });
        const endTime = Date.now();

        console.log(`Status: ${res.status} (took ${endTime - startTime}ms)`);
        const data = (await res.json()) as any;
        console.log(`Nonce: ${data.nonce}`);
    } catch (err: any) {
        console.error('Fetch failed in Node script:', err);
        if (err.cause) console.error('Cause:', err.cause);
    }
}
test();
