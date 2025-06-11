import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'; // Import necessary auth modules and User type
import { app } from "../firebase-config"; // Import app from the config file

// Initialize Firebase services using the imported app
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Auth

interface Attribute {
  key: string;
  value: string;
}

interface MediaItem {
  name: string;
  uri: string;
  type: string;
}

interface Document {
  name: string;
  uri: string;
  type: string;
}

interface DocumentMetadata {
  name: string;
  description: string;
  image: string; // Firebase Storage URI
  external_url: string;
  attributes: Attribute[];
  documents: Document[]; // Firebase Storage URIs
  additional_media: MediaItem[]; // Firebase Storage URIs
}

const DocumentMetadataForm: React.FC = () => {
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    name: '',
    description: '',
    image: '',
    external_url: '',
    attributes: [],
    documents: [],
    additional_media: [],
  });

  const [user, setUser] = useState<User | null>(null); // State to hold the authenticated user
  const [loadingAuth, setLoadingAuth] = useState(true); // State to track auth loading

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata({ ...metadata, [name]: value });
  };

  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttributes = [...metadata.attributes];
    newAttributes[index][field] = value;
    setMetadata({ ...metadata, attributes: newAttributes });
  };

  const addAttribute = () => {
    setMetadata({ ...metadata, attributes: [...metadata.attributes, { key: '', value: '' }] });
  };

  const removeAttribute = (index: number) => {
    const newAttributes = metadata.attributes.filter((_, i) => i !== index);
    setMetadata({ ...metadata, attributes: newAttributes });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'documents' | 'additional_media', index?: number) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    // Ensure user is logged in before uploading
    if (!user) {
      alert('Please sign in to upload files.');
      return;
    }

    // Include user uid in storage path for organization/access control (optional but recommended)
    const storagePath = `${user.uid}/${field}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const uri = await getDownloadURL(snapshot.ref);

      if (field === 'image') {
        setMetadata({ ...metadata, image: uri });
      } else if (field === 'documents') {
        if (index !== undefined) {
          const newDocuments = [...metadata.documents];
          newDocuments[index].uri = uri;
          newDocuments[index].name = file.name;
          newDocuments[index].type = file.type;
          setMetadata({ ...metadata, documents: newDocuments });
        } else {
           setMetadata({ ...metadata, documents: [...metadata.documents, { name: file.name, uri, type: file.type }] });
        }
      } else if (field === 'additional_media') {
         if (index !== undefined) {
          const newMedia = [...metadata.additional_media];
          newMedia[index].uri = uri;
          newMedia[index].name = file.name;
          newMedia[index].type = file.type;
          setMetadata({ ...metadata, additional_media: newMedia });
        } else {
           setMetadata({ ...metadata, additional_media: [...metadata.additional_media, { name: file.name, uri, type: file.type }] });
        }
      }
    } catch (error) {
      console.error("Error uploading file: ", error);
      alert('Error uploading file.');
    }
  };

  const addDocument = () => {
    setMetadata({ ...metadata, documents: [...metadata.documents, { name: '', uri: '', type: '' }] });
  };

  const removeDocument = (index: number) => {
    const newDocuments = metadata.documents.filter((_, i) => i !== index);
    setMetadata({ ...metadata, documents: newDocuments });
  };

   const addAdditionalMedia = () => {
    setMetadata({ ...metadata, additional_media: [...metadata.additional_media, { name: '', uri: '', type: '' }] });
  };

  const removeAdditionalMedia = (index: number) => {
    const newMedia = metadata.additional_media.filter((_, i) => i !== index);
    setMetadata({ ...metadata, additional_media: newMedia });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure user is logged in before saving metadata
    if (!user) {
      alert('Please sign in to save metadata.');
      return;
    }

    try {
      // Save metadata to Firestore
      // Optionally, include the user's UID in the document data or as the document ID
      await addDoc(collection(db, `users/${user.uid}/documentMetadata`), metadata);
      alert('Metadata saved successfully!');
      // Reset form or navigate
       setMetadata({
        name: '',
        description: '',
        image: '',
        external_url: '',
        attributes: [],
        documents: [],
        additional_media: [],
      });

    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Error saving metadata.');
    }
  };

  if (loadingAuth) {
    return <div>Loading authentication state...</div>;
  }

  if (!user) {
    return <div>Please sign in to add document metadata.</div>;
  }

  // Render the form if user is authenticated
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input type="text" name="name" value={metadata.name} onChange={handleInputChange} required />
      </div>
      <div>
        <label>Description:</label>
        <textarea name="description" value={metadata.description} onChange={handleInputChange} required />
      </div>
      <div>
        <label>Image:</label>
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
        {metadata.image && <p>Uploaded: <a href={metadata.image} target="_blank" rel="noopener noreferrer">{metadata.image}</a></p>}
      </div>
      <div>
        <label>External URL:</label>
        <input type="url" name="external_url" value={metadata.external_url} onChange={handleInputChange} />
      </div>

      <div>
        <h3>Attributes:</h3>
        {metadata.attributes.map((attribute, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="Key"
              value={attribute.key}
              onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={attribute.value}
              onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
            />
            <button type="button" onClick={() => removeAttribute(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addAttribute}>Add Attribute</button>
      </div>

      <div>
        <h3>Documents:</h3>
        {metadata.documents.map((doc, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="Document Name"
              value={doc.name}
              onChange={(e) => {
                 const newDocuments = [...metadata.documents];
                 newDocuments[index].name = e.target.value;
                 setMetadata({...metadata, documents: newDocuments});
              }}
            />
             <input
              type="text"
              placeholder="Document Type"
              value={doc.type}
               onChange={(e) => {
                 const newDocuments = [...metadata.documents];
                 newDocuments[index].type = e.target.value;
                 setMetadata({...metadata, documents: newDocuments});
              }}
            />
            <input type="file" onChange={(e) => handleFileChange(e, 'documents', index)} />
            {doc.uri && <p>Uploaded: <a href={doc.uri} target="_blank" rel="noopener noreferrer">{doc.uri}</a></p>}
            <button type="button" onClick={() => removeDocument(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addDocument}>Add Document</button>
      </div>

      <div>
        <h3>Additional Media:</h3>
        {metadata.additional_media.map((media, index) => (
          <div key={index}>
             <input
              type="text"
              placeholder="Media Name"
              value={media.name}
               onChange={(e) => {
                 const newMedia = [...metadata.additional_media];
                 newMedia[index].name = e.target.value;
                 setMetadata({...metadata, additional_media: newMedia});
              }}
            />
             <input
              type="text"
              placeholder="Media Type"
              value={media.type}
               onChange={(e) => {
                 const newMedia = [...metadata.additional_media];
                 newMedia[index].type = e.target.value;
                 setMetadata({...metadata, additional_media: newMedia});
              }}
            />
            <input type="file" onChange={(e) => handleFileChange(e, 'additional_media', index)} />
            {media.uri && <p>Uploaded: <a href={media.uri} target="_blank" rel="noopener noreferrer">{media.uri}</a></p>}
            <button type="button" onClick={() => removeAdditionalMedia(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addAdditionalMedia}>Add Additional Media</button>
      </div>

      <button type="submit">Save Metadata</button>
    </form>
  );
};

export default DocumentMetadataForm;