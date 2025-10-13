import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  _id: string;
  seekerId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate favorites
FavoriteSchema.index({ seekerId: 1, listingId: 1 }, { unique: true });

// Index for better query performance
FavoriteSchema.index({ seekerId: 1, createdAt: -1 });
FavoriteSchema.index({ listingId: 1 });

const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export { Favorite };
