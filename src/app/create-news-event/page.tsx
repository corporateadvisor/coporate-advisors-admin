"use client";

import { useEffect, useState, Suspense } from "react";
import { FiUpload } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type FormDataType = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
};

export default function CreateNewsEvent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateNewsEventContent />
    </Suspense>
  );
}

function CreateNewsEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "true";
  const docId = searchParams.get("docId");

  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    title: "",
    description: "",
    imageUrl: "",
    pdfUrl: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [buttonLabel, setButtonLabel] = useState("Submit");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && docId) {
        try {
          const docRef = doc(db, "uploads", docId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data() as FormDataType);
          }
        } catch (err) {
          console.error("Error fetching document:", err);
          setError("Failed to load document");
        }
      }
    };
    fetchData();
  }, [editMode, docId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setButtonLabel("Submitting...");

    try {
      let imageUrl = formData.imageUrl;
      let pdfUrl = formData.pdfUrl;

      // Upload image if provided
      if (imageFile) {
        const imageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
        const imageSnapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageSnapshot.ref);
        console.log("Image uploaded:", imageUrl);
      }

      // Upload PDF if provided
      if (pdfFile) {
        const pdfRef = ref(storage, `pdfs/${Date.now()}_${pdfFile.name}`);
        const pdfSnapshot = await uploadBytes(pdfRef, pdfFile);
        pdfUrl = await getDownloadURL(pdfSnapshot.ref);
        console.log("PDF uploaded:", pdfUrl);
      }

      const dataToSave = {
        ...formData,
        imageUrl,
        pdfUrl,
        updatedAt: new Date(),
      };

      console.log("Saving data:", dataToSave);

      // Save to Firestore
      if (editMode && docId) {
        await updateDoc(doc(db, "uploads", docId), dataToSave);
        console.log("Document updated");
      } else {
        const docRef = await addDoc(collection(db, "uploads"), {
          ...dataToSave,
          createdAt: new Date(),
        });
        console.log("Document written with ID: ", docRef.id);
      }

      setButtonLabel("Submitted!");
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push("/news-event-list");
      }, 1000);

    } catch (err) {
      console.error("Error submitting form:", err);
      setError(`Failed to submit: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setButtonLabel("Submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md mt-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/news-event-list")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-blue-700">
          {editMode ? "Edit News/Event" : "Create News/Event"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID *</label>
          <input
            placeholder="Unique ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="border p-2 w-full rounded"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border p-2 w-full rounded"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border p-2 w-full rounded"
            rows={4}
            disabled={loading}
          />
        </div>

        {/* File upload sections remain the same */}
        <div className="mb-6 w-full max-w-full">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Image Upload
          </label>
          <div className="flex items-center justify-between border border-gray-700 rounded px-4 py-3 bg-gray-10">
            <div className="flex items-center space-x-2">
              <FiUpload className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">
                {imageFile ? imageFile.name : "Drag and drop image here or"}
              </span>
            </div>
            <label
              htmlFor="imageInput"
              className="ml-auto cursor-pointer bg-blue-10 border border-gray-700 text-gray-700 px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center space-x-1"
            >
              <FiUpload className="h-4 w-4" />
              <span>Upload</span>
            </label>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        <div className="mb-6 w-full max-w-full">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            PDF Upload
          </label>
          <div className="flex items-center justify-between border border-gray-700 rounded px-4 py-3 bg-gray-10">
            <div className="flex items-center space-x-2">
              <FiUpload className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">
                {pdfFile ? pdfFile.name : "Drag and drop PDF here or"}
              </span>
            </div>
            <label
              htmlFor="pdfInput"
              className="ml-auto cursor-pointer bg-blue-10 border border-gray-700 text-gray-700 px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center space-x-1"
            >
              <FiUpload className="h-4 w-4" />
              <span>Upload</span>
            </label>
            <input
              id="pdfInput"
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : buttonLabel}
        </button>
      </form>
    </div>
  );
}