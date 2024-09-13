import sys
import json
import numpy as np
from sentence_transformers import SentenceTransformer, util

# Load the model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def main():
    try:
        # Read data from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)

        # Get the embeddings for the phrase and the embedded chunks
        phrase_embedding = np.array(data['phraseEmbedding'])
        embedded_chunks = np.array(data['embeddedChunks'])

        # Calculate cosine similarity between the phrase embedding and all embedded chunks
        similarities = util.cos_sim(phrase_embedding, embedded_chunks)

        # Find the index of the highest similarity score
        best_match_idx = np.argmax(similarities)

        # Return the best matching chunk (or its index, based on your use case)
        best_match = {
            'chunk': data['embeddedChunks'][best_match_idx],
            'similarity': float(similarities[0][best_match_idx])
        }

        # Output the result to stdout
        print(json.dumps(best_match))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
