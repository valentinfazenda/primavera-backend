from sentence_transformers import SentenceTransformer

# Charger le modèle que tu veux déployer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Sauvegarder le modèle dans un répertoire local
model.save('./model')
