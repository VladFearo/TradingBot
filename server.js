const Alpaca = require( '@alpacahq/alpaca-trade-api' );
const alpaca = new Alpaca(); // Environment Variables
const WebSocket = require( 'ws' );

const wss = new WebSocket( 'wss://stream.data.alpaca.markets/v1beta1/news' );

wss.on( 'open', function ()
{
    console.log( 'WebSocket connected!' );

    // We now have to log in the data source
    const authMsg = {
        action: 'auth',
        key: process.env.APCA_API_KEY_ID,
        secret: process.env.APCA_API_SECRET_KEY
    };
    wss.send( JSON.stringify( authMsg ) ); // Send auth data to ws, "Log us in"

    // Subscribe to all news feeds
    const subscribeMsg = {
        action: 'subscribe',
        news: [ '*' ],
    };
    wss.send( JSON.stringify( subscribeMsg ) ); // Connect to the live data source of news

} );

wss.on( 'message', async function ( msg )
{
    console.log( 'The message is' + msg );
    const currentEvent = JSON.parse( msg )[ 0 ];
    if ( currentEvent.T === "n" )
    { // News event
        let companyImpact = 0;
        // Ask ChatGPT what it thinks on the headline
        // 1 - 100, 1 being the worst, and 100 being the best impact on the company.

        const apiRequestBody = {
            "model": "gpt-3.5-turbo",
            "messages": [
                { role: "system", content: "Only respond with a number from 1-100 detailing the impact of the headline." },
                { role: "user", content: "Given the headline '" + currentEvent.headline + "', show me a number from 1-100 detailing the impact of this headline." }
            ]
        };

        await fetch( "https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify( apiRequestBody )
        } ).then( ( data ) =>
        {
            return data.json();
        } ).then( ( data ) =>
        {
            // data is the ChatGPT response
            console.log( data );
            console.log( data.choices[ 0 ].message );
            companyImpact = parseInt( data.choices[ 0 ].message.content );
        } );
        // Make trades based on the output

        if ( companyImpact >= 70 )
        {
            // Buy stock
            let order = await alpaca.createOrder( {
                symbol: tickerSymbol,
                qty: 1,
                side: 'buy',
                type: 'market',
                time_in_force: 'day' // day ends, it wont trade.
            } );
        }
        else if ( companyImpact <= 30 )
        {
            // Sell stock
            let closedPosition = alapac.closedPosition( ticketSymbol );
        }


    }
} );