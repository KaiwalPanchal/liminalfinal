

// Function to insert text
export async function insertText(text:any) {
    const url = "http://34.29.242.183:8020/insert";
    const payload = { text };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error inserting text:', error);
        throw error;
    }
}

// Function to query with specific parameters
export async function queryText(query:any) {
    const modified_query = query + "what are the nodes that can be most relevant to this on both levels?"
    const url = "http://34.29.242.183:8020/query";
    const payload = {
        query: modified_query,
        mode: "hybrid",
        only_need_context: true
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return await response.json();
    } catch (error) {
        console.error('Error querying text:', error);
        throw error;
    }
}
