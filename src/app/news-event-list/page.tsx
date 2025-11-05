"use client";

import { useEffect, useState } from "react";
import { db, storage, auth } from "../firebase";
import { collection, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface UploadData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
  docId: string;
  createdAt: Date;
}

export default function ViewUploads() {
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUploads = async () => {
      const querySnapshot = await getDocs(collection(db, "uploads"));
      const data: UploadData[] = querySnapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        
        // Handle date field properly
        let createdAt = new Date();
        if (d.createdAt) {
          // Check if it's a Firestore Timestamp
          if (d.createdAt instanceof Timestamp) {
            createdAt = d.createdAt.toDate();
          } else if (d.createdAt.toDate) {
            // Fallback for any object with toDate method
            createdAt = d.createdAt.toDate();
          } else {
            // If it's already a Date object or string
            createdAt = new Date(d.createdAt);
          }
        }
        
        return { 
          ...d, 
          docId: docSnap.id,
          createdAt: createdAt
        } as UploadData;
      });
      
      // Sort by date - newest first
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setUploads(data);
    };

    fetchUploads();
  }, []);

  const handleDelete = async (upload: UploadData) => {
    setDeletingId(upload.docId);
    try {
      if (upload.imageUrl) {
        const imageRef = ref(storage, upload.imageUrl);
        await deleteObject(imageRef).catch(() => {});
      }
      if (upload.pdfUrl) {
        const pdfRef = ref(storage, upload.pdfUrl);
        await deleteObject(pdfRef).catch(() => {});
      }

      await deleteDoc(doc(db, "uploads", upload.docId));
      setUploads((prev) => prev.filter((item) => item.docId !== upload.docId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="p-8 max-w-[90%] mx-auto">
      <div className="pb-4 mb-6 border-b-4 border-blue-600 relative">
        <div className="absolute top-0 right-0 flex space-x-2">
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded transition-all shadow"
          >
            Sign Out
          </button>
        </div>

        <div className="flex justify-center">
          <h2 className="text-3xl font-extrabold text-gray-800">
            News and Events
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <div className="mt-2 flex justify-center">
          <Link
            href="/create-news-event"
            className="bg-blue-600 mb-3 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow"
          >
            + Create News & Events
          </Link>
        </div>
        <table className="min-w-full text-left border border-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                ID
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                Title
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                Description
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                Image
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                PDF
              </th>
              <th className="px-6 py-3 border-b font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr key={upload.docId} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 border-b">{upload.id}</td>
                <td className="px-6 py-4 border-b max-w-xs">
                  <div className="max-h-17 overflow-hidden scrollbar-hidden">
                    <p>{upload.title}</p>
                  </div>
                </td>
                <td className="px-6 py-4 border-b max-w-md">
                  <div className="max-h-17 overflow-hidden scrollbar-hidden">
                    <p>{upload.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  {upload.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 border-b">
                  {upload.imageUrl && (
                    <Image
                      src={upload.imageUrl}
                      alt="Uploaded"
                      width={64}
                      height={64}
                      className="object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 border-b">
                  {upload.pdfUrl && (
                    <a
                      href={upload.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      View PDF
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 border-b space-x-2">
                  <button
                    onClick={() => handleDelete(upload)}
                    className={`px-4 py-1 rounded transition mb-2 text-white ${
                      deletingId === upload.docId
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    disabled={deletingId === upload.docId}
                  >
                    {deletingId === upload.docId ? "Deleting..." : "Delete"}
                  </button>
                  <Link
                    href={`/create-news-event?edit=true&docId=${upload.docId}`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-1 rounded transition"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {uploads.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No uploads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}