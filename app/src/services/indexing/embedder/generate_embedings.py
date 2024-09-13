from sentence_transformers import SentenceTransformer
import sys
import json

def embed_sentences(sentences):
    # Load a lightweight and efficient model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(sentences)
    return embeddings

if __name__ == "__main__":
    input_data = sys.stdin.read()
    if not input_data:
        print("No input data received", file=sys.stderr)
        sys.exit(1)

    chunks = json.loads(input_data)

    # Generate embeddings
    embeddings = embed_sentences(chunks)

    # Output the embeddings as JSON
    print(json.dumps(embeddings.tolist()))