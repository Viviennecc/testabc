import React from "react";

const BookDetailsModal = ({
  selectedBook,
  onClose,
  onToggleBorrow,
  displayUserName,
}) => {
  if (!selectedBook) return null;

  const isOwner = selectedBook.borrowedBy === displayUserName;
  const isAvailable = selectedBook.status === "Available";

  return (
    <div className="lib-modal-overlay" onClick={onClose}>
      <div
        className="lib-modal lib-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lib-modal-header">{selectedBook.title}</div>
        <div className="lib-modal-body">
          <div className="lib-details-grid">
            <div className="lib-detail-item">
              <strong>Author:</strong> {selectedBook.author}
            </div>
            <div className="lib-detail-item">
              <strong>Genre:</strong> {selectedBook.genre}
            </div>
            <div className="lib-detail-item">
              <strong>Year:</strong> {selectedBook.publishedYear}
            </div>
            <div className="lib-detail-item">
              <strong>ISBN:</strong> {selectedBook.isbn || "N/A"}
            </div>
            <div className="lib-detail-item">
              <strong>Pages:</strong> {selectedBook.totalPages || "N/A"}
            </div>
            <div className="lib-detail-item full-width">
              <strong>Description:</strong> {selectedBook.description}
            </div>
            <div className="lib-detail-item">
              <strong>Status:</strong> {selectedBook.status}
              {selectedBook.borrowedBy &&
                ` (Borrowed by: ${selectedBook.borrowedBy})`}
            </div>
          </div>
        </div>
        <div className="lib-modal-footer">
          {isAvailable || isOwner ? (
            <button
              className={isAvailable ? "lib-btn-primary" : "lib-btn-secondary"}
              onClick={() => onToggleBorrow(selectedBook.id)}
            >
              {isAvailable ? "Borrow Book" : "Return Book"}
            </button>
          ) : (
            <button
              className="lib-btn-secondary"
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }}
            >
              Already Borrowed
            </button>
          )}
          <button className="lib-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
