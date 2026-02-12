import React, { useState } from 'react';
import './ProductList.css';

const ProductList = () => {
  const [viewMode, setViewMode] = useState('list');
  const [selectedSize, setSelectedSize] = useState('All Sizes');

  const products = [
    {
      id: 1,
      name: 'Areca Round Dinner Plate',
      sku: 'ARP-10RND-01',
      size: '10-inch',
      costPrice: '₹4.50',
      sellPrice: '₹8.00',
      margin: '43.7%',
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt417bR4fL7dfXHZAlSSXI0HUbJfNOT79cyqn7sjmM8xrgK9eGM5RVvWNuLjksidw8llAJa4ORPn6fU6l3Adc_gU8N52OIPhqg6eFYBM81h2jJG6nh0KLVUO1tG2Dv6IMfH1kGLce_2c_PI5Yfg4vKbd_J0sFeoHd7598_4B_WBLtTWwPxPOSEeZFwE0qp7gbKweVtqK_1la7wQ5Uc9G3Tv7QoeLWQLzspu0nGCc54kd5fSPIXz2RYhKPicEQZEYsmlIbYRDW0cpJ3'
    },
    {
      id: 2,
      name: 'Square Serving Plate',
      sku: 'ARP-12SQ-05',
      size: '12-inch',
      costPrice: '₹6.20',
      sellPrice: '₹11.50',
      margin: '46.1%',
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArLlrpTxsPxTkEB1fh1TY1GZoOE7i0AcC-bnMal5c2ckegwELqUvOtvaHS54I6N8qW8vdi_ztpEOYKcTc3b_iZdJK2ijqmnRWMunSDk3M9wzjczR84cwKJiafq-M6alvVbDyZtT00i3sBbMp8Ydzco7xsQyzBO9CKVF13yA_1aHFt-KPBrmtLCDU2BbZ2Pn5edTI6-s3KGHZeNzgc9zwZOiUjlSOLQOg54nDQtHefV131pWg3L2ROhl9-Gvr14WFmY9FOt34b1CE9S'
    },
    {
      id: 3,
      name: 'Heart-Shaped Snack Bowl',
      sku: 'ARP-4HRT-12',
      size: '4-inch',
      costPrice: '₹2.00',
      sellPrice: '₹4.50',
      margin: '55.5%',
      status: 'Inactive',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh57LfdKEiHQqSfrA6UrD6tJGi-_N_LQn3Z0_EaIL5gi-9KiMel9OVju7ykq92DQ7kKa8DGJIa04ONFubuMRXPLkzfxDi7Dd9YOcwA7zaV5QdwgeAvfzTZvJIxYTJ4kXmmjDd9ZoaJ6KbfFkvIWgh2TOOLggrDPuj0LcsyIm-3MYdnori2Pgu4DOWo11w-KJ-3sYJfh8Up41U48zK6e8Q3bFbA_lhBqoz3H2em3-kFjQTHeq2jhxGx9nIg0IF0MeMpfCdMKwgMKpjp'
    },
    {
      id: 4,
      name: 'Deep Square Bowl',
      sku: 'ARP-6DSQ-09',
      size: '6-inch',
      costPrice: '₹3.80',
      sellPrice: '₹6.50',
      margin: '41.5%',
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiLRTzDhp3EMoRfqJn6mJ_o6cEg237wQ1XnTyi_1Z5yRvA3xDxgkKaKAMiZBE1mdALWCqJx_BYqMiNtc0pCRjoe4u8l_zh-54FPot3T6L3Yo9solvxLY4GgqRODDT0vNKahhZynTTTKxuF5CgBiILOMnDV3fBJjr68QWz7uKOsXJfsK8e2ffDmt3xBXjwWtqGzivVZzfHa1POEBoOeSn4Zs2GylRR0EX6r3K1aKNLtlTWB2RI90SuFSyQZZpVulp8q-QQdCAHdSL1_'
    }
  ];

  const sizeFilters = ['All Sizes', '12-inch', '10-inch', '6-inch', '4-inch'];

  return (
    <div className="product-list-container">
      {/* Breadcrumbs & View Toggle */}
      <div className="product-header">
        <div className="breadcrumb">
          <a href="/" className="breadcrumb-link">Home</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Products</span>
        </div>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="size-filters">
          {sizeFilters.map((size) => (
            <button
              key={size}
              className={`size-filter-btn ${selectedSize === size ? 'active' : ''}`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          ))}
        </div>
        <button className="more-filters-btn">
          <span className="material-symbols-outlined">filter_alt</span>
          More Filters
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Size</th>
                <th>Cost Price</th>
                <th>Sell Price</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="product-row">
                  <td>
                    <div className="product-info">
                      <div 
                        className={`product-image ${product.status === 'Inactive' ? 'inactive' : ''}`}
                        style={{ backgroundImage: `url("${product.image}")` }}
                      ></div>
                      <div>
                        <p className="product-name">{product.name}</p>
                        <p className="product-sku">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td>{product.size}</td>
                  <td>{product.costPrice}</td>
                  <td className="sell-price">{product.sellPrice}</td>
                  <td>
                    <span className={`margin-badge ${product.status === 'Active' ? 'active' : 'inactive'}`}>
                      {product.margin}
                    </span>
                  </td>
                  <td>
                    <div className="status-toggle">
                      <div className={`toggle-switch ${product.status === 'Active' ? 'active' : ''}`}>
                        <div className={`toggle-dot ${product.status === 'Active' ? 'active' : ''}`}></div>
                      </div>
                      <span className={`status-text ${product.status === 'Active' ? 'active' : 'inactive'}`}>
                        {product.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="delete-btn">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <p className="pagination-info">Showing <span>1-4</span> of <span>24</span> products</p>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled>Previous</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-card-image" style={{ backgroundImage: `url("${product.image}")` }}>
                <span className={`product-status-badge ${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
              </div>
              <div className="product-card-content">
                <div className="product-card-header">
                  <div>
                    <h3 className="product-card-title">{product.name}</h3>
                    <p className="product-card-sku">SKU: {product.sku}</p>
                  </div>
                  <span className="product-card-margin">{product.margin}</span>
                </div>
                <div className="product-card-details">
                  <div>
                    <span className="detail-label">Cost</span>
                    <p className="detail-value">{product.costPrice}</p>
                  </div>
                  <div>
                    <span className="detail-label">Sell</span>
                    <p className="detail-value">{product.sellPrice}</p>
                  </div>
                  <div>
                    <span className="detail-label">Size</span>
                    <p className="detail-value">{product.size}</p>
                  </div>
                </div>
                <div className="product-card-actions">
                  <button className="card-edit-btn">Edit</button>
                  <button className="card-view-btn">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="product-footer-stats">
        <div className="stat-box">
          <p className="stat-box-label">Total SKUs</p>
          <p className="stat-box-value">24</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Active Products</p>
          <div className="stat-box-active">
            <p className="stat-box-value active">21</p>
            <span className="active-percentage">87%</span>
          </div>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Avg Margin</p>
          <p className="stat-box-value">44.8%</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Exported Reports</p>
          <button className="export-btn">
            <span className="material-symbols-outlined">download</span>
            Get CSV Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductList;