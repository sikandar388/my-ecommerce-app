"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useIsAdmin from "@/lib/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  Eye,
  X,
  Filter,
  Search,
} from "lucide-react";

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
  is_active: boolean;
  category_id: number;
  categories?: { name: string };
};

type Category = {
  id: number;
  name: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    stock: "",
    image: null as File | null,
    category_id: "",
  });
  const [togglingProduct, setTogglingProduct] = useState<number | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  // Fetch products with categories
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select(`
        *,
        categories(name)
      `);
    if (!error && data) {
      setProducts(data);
      setFilteredProducts(data);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Filter products based on category and search
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category_id.toString() === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.categories?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  // Toggle product active status
  const toggleProductStatus = async (
    productId: number,
    currentStatus: boolean,
    productTitle: string,
    productStock: number
  ) => {
    if (productStock < 1 && currentStatus === false) {
      alert("Failed to update product status because product is out of stock.");
      return;
    }
    const action = currentStatus ? "deactivate" : "activate";
    if (
      !window.confirm(`Are you sure you want to ${action} "${productTitle}"?`)
    ) {
      return;
    }

    setTogglingProduct(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Failed to update product status");
    } finally {
      setTogglingProduct(null);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let image_url = editingProduct?.image_url || null;

    if (form.image) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(`images/${Date.now()}-${form.image.name}`, form.image);

      if (uploadError) {
        alert("Image upload failed");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(uploadData.path);
      image_url = urlData.publicUrl;
    }

    const stock = Number(form.stock);

    const productData = {
      title: form.title,
      price: Number(form.price),
      description: form.description,
      stock: stock,
      image_url,
      category_id: Number(form.category_id),
      is_active: stock > 0 ? editingProduct?.is_active ?? true : false,
    };

    let error;
    if (editingProduct) {
      const result = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      error = result.error;
    } else {
      const result = await supabase.from("products").insert([productData]);
      error = result.error;
    }

    if (!error) {
      setShowModal(false);
      setEditingProduct(null);
      setForm({
        title: "",
        price: "",
        description: "",
        stock: "",
        image: null,
        category_id: "",
      });
      fetchProducts();
    } else {
      alert(
        editingProduct ? "Failed to update product" : "Failed to add product"
      );
    }
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      price: product.price.toString(),
      description: product.description,
      stock: product.stock.toString(),
      image: null,
      category_id: product.category_id?.toString() || "",
    });
    setShowModal(true);
  };

  // Handle delete product
  const handleDelete = async (productId: number, productTitle: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`
      )
    ) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (!error) {
        fetchProducts();
      } else {
        alert("Failed to delete product");
      }
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm({
      title: "",
      price: "",
      description: "",
      stock: "",
      image: null,
      category_id: "",
    });
  };

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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your product inventory and details
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200 shadow-sm"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Products
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter((p) => p.is_active).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.filter((p) => p.stock < 1).length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Filtered Results
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Filter className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory === "all"
                  ? "All Products"
                  : `${
                      categories.find(
                        (c) => c.id.toString() === selectedCategory
                      )?.name
                    } Products`}
              </h2>
              <span className="text-sm text-gray-600">
                {filteredProducts.length} of {products.length} products
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group"
              >
                {/* Product Image */}
                <div className="relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <Package className="text-gray-400" size={40} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.categories?.name || "No Category"}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-blue-600">
                      ${product.price}
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        product.stock < 1
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        toggleProductStatus(
                          product.id,
                          product.is_active,
                          product.title,
                          product.stock
                        )
                      }
                      disabled={togglingProduct === product.id}
                      className={`flex-1 px-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1 ${
                        product.is_active
                          ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                          : "bg-green-50 hover:bg-green-100 text-green-600"
                      }`}
                    >
                      {togglingProduct === product.id ? (
                        <span>Processing...</span>
                      ) : product.is_active ? (
                        <>
                          <X size={14} />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory !== "all"
                  ? "No products match your filters"
                  : "No products found"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Start by adding your first product to the inventory."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                    value={form.category_id}
                    onChange={(e) =>
                      setForm({ ...form, category_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Title
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Enter product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.files?.[0] || null })
                    }
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Package className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600">
                      {form.image
                        ? form.image.name
                        : editingProduct?.image_url
                        ? "Click to change image"
                        : "Click to upload an image"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    {editingProduct?.image_url && !form.image && (
                      <p className="text-xs text-blue-600 mt-2">
                        Current image will be kept if no new image is selected
                      </p>
                    )}
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {editingProduct ? <Edit3 size={20} /> : <Plus size={20} />}
                  <span>
                    {editingProduct ? "Update Product" : "Add Product"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
