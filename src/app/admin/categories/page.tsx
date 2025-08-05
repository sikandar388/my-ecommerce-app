// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import useIsAdmin from "@/lib/hooks/useIsAdmin";
// import { useRouter } from "next/navigation";

// type Category = {
//   id: string;
//   name: string;
// };

// export default function AdminCategoriesPage() {
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [newCategory, setNewCategory] = useState("");
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editingName, setEditingName] = useState("");
//   const { isAdmin, loading } = useIsAdmin();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !isAdmin) router.push("/");
//   }, [isAdmin, loading, router]);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from("categories")
//       .select("*")
//       .order("name", { ascending: true });

//     if (!error && data) {
//       setCategories(data);
//     }
//   };

//   const handleAddCategory = async () => {
//     if (!newCategory.trim()) return;

//     const { error } = await supabase.from("categories").insert({
//       name: newCategory.trim(),
//     });

//     if (!error) {
//       setNewCategory("");
//       fetchCategories();
//     }
//   };

//   const handleDelete = async (id: string) => {
//     const confirm = window.confirm("Are you sure you want to delete this category?");
//     if (!confirm) return;

//     const { error } = await supabase.from("categories").delete().eq("id", id);

//     if (!error) fetchCategories();
//   };

//   const handleEdit = (category: Category) => {
//     setEditingId(category.id);
//     setEditingName(category.name);
//   };

//   const handleUpdate = async () => {
//     if (!editingId || !editingName.trim()) return;

//     const { error } = await supabase
//       .from("categories")
//       .update({ name: editingName.trim() })
//       .eq("id", editingId);

//     if (!error) {
//       setEditingId(null);
//       setEditingName("");
//       fetchCategories();
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>

//       {/* Add New */}
//       <div className="flex gap-2 mb-4">
//         <input
//           type="text"
//           value={newCategory}
//           onChange={(e) => setNewCategory(e.target.value)}
//           placeholder="New Category Name"
//           className="flex-1 border p-2 rounded"
//         />
//         <button
//           onClick={handleAddCategory}
//           className="bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           Add
//         </button>
//       </div>

//       {/* List */}
//       <ul className="space-y-2">
//         {categories.map((cat) => (
//           <li
//             key={cat.id}
//             className="p-3 border rounded bg-white shadow-sm flex justify-between items-center"
//           >
//             {editingId === cat.id ? (
//               <div className="flex w-full gap-2">
//                 <input
//                   type="text"
//                   value={editingName}
//                   onChange={(e) => setEditingName(e.target.value)}
//                   className="flex-1 border p-2 rounded"
//                 />
//                 <button
//                   onClick={handleUpdate}
//                   className="bg-green-600 text-white px-3 py-1 rounded"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={() => setEditingId(null)}
//                   className="bg-gray-400 text-white px-3 py-1 rounded"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <span>{cat.name}</span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => handleEdit(cat)}
//                     className="text-blue-600 text-sm"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(cat.id)}
//                     className="text-red-600 text-sm"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useIsAdmin from "@/lib/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { Plus, Edit3, Trash2, Tag, Check, X, Search } from "lucide-react";

type Category = {
  id: string;
  name: string;
  product_count?: number;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/");
  }, [isAdmin, loading, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    
    // First get categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (categoriesError) {
      setIsLoading(false);
      return;
    }

    // Then get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categoriesData.map(async (category) => {
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id);
        
        return {
          ...category,
          product_count: count || 0
        };
      })
    );

    setCategories(categoriesWithCounts);
    setIsLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const { error } = await supabase.from("categories").insert({
      name: newCategory.trim(),
    });

    if (!error) {
      setNewCategory("");
      fetchCategories();
    } else {
      alert("Failed to add category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${name}"? This will affect all products in this category.`
    );
    if (!confirm) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (!error) {
      fetchCategories();
    } else {
      alert("Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleUpdate = async () => {
    if (!editingId || !editingName.trim()) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: editingName.trim() })
      .eq("id", editingId);

    if (!error) {
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    } else {
      alert("Failed to update category");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName("");
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Organize your products with categories</p>
            </div>
            <div className="flex items-center space-x-2">
              <Tag className="text-blue-600" size={24} />
              <span className="text-2xl font-bold text-gray-900">{categories.length}</span>
              <span className="text-gray-600">Categories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Add New Category */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Category</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus size={20} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">All Categories</h2>
              <span className="text-sm text-gray-600">
                {filteredCategories.length} of {categories.length} categories
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No categories match your search" : "No categories found"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Try adjusting your search criteria." 
                  : "Start by adding your first category above."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  {editingId === category.id ? (
                    // Edit Mode
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleUpdate();
                            if (e.key === 'Escape') handleCancel();
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                          title="Save changes"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                          title="Cancel editing"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Tag className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {category.product_count} products
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Product Count Badge */}
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {category.product_count} items
                        </span>
                        
                        {/* Action Buttons */}
                        <button
                          onClick={() => handleEdit(category)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {categories.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Tag className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-green-600">
                    {categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Tag className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Products/Category</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0) / categories.length)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Tag className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}