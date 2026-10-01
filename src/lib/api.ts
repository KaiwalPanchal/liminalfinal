

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Function to insert text / ingest note
export async function insertText(text: any, title?: string, noteId?: string) {
    const url = `${API_BASE_URL}/api/ingest`;
    const payload = {
        text,
        title: title || "Untitled Note",
        note_id: noteId || undefined
    };

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

// Function to query Grounded Hybrid GraphRAG
export async function queryText(query: string, maxHops: number = 2, topK: number = 5) {
    const url = `${API_BASE_URL}/api/query`;
    const payload = {
        query,
        max_hops: maxHops,
        top_k: topK
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return await response.json();
    } catch (error) {
        console.error('Error querying Grounded GraphRAG:', error);
        throw error;
    }
}

