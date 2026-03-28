'use server';
/**
 * @fileOverview This file defines a Genkit flow for sorting property listings by "AI Best Value".
 *
 * - sortPropertiesByAiBestValue - A function that sorts a list of properties
 *   based on their AI-estimated value compared to their listed price.
 * - AiBestValueInput - The input type for the sortPropertiesByAiBestValue function.
 * - AiBestValueOutput - The return type for the sortPropertiesByAiBestValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for property details relevant for price estimation.
// This mirrors the fields of a 'listing' document in Firestore that would be used by the ML model.
const PropertyDetailsForEstimationSchema = z.object({
  id: z.string().describe('Unique identifier of the property.'),
  mode: z.enum(['sale', 'rent']).describe('Mode of listing: sale or rent.'),
  type: z.enum(['apartment', 'villa', 'plot', 'commercial']).describe('Type of property.'),
  price: z.number().optional().describe('Sale price of the property.'),
  rentMonthly: z.number().optional().describe('Monthly rent of the property.'),
  areaSqft: z.number().describe('Area of the property in square feet.'),
  bedrooms: z.number().describe('Number of bedrooms.'),
  bathrooms: z.number().describe('Number of bathrooms.'),
  furnishing: z.string().optional().describe('Furnishing status (e.g., "furnished", "unfurnished").'),
  parking: z.boolean().optional().describe('Availability of parking.'),
  floor: z.number().optional().describe('Floor number.'),
  ageYears: z.number().optional().describe('Age of the property in years.'),
  facing: z.string().optional().describe('Direction the property is facing.'),
  amenities: z.array(z.string()).optional().describe('List of amenities.'),
  location: z.object({
    lat: z.number().describe('Latitude of the property.'),
    lng: z.number().describe('Longitude of the property.'),
    geohash: z.string().optional().describe('Geohash of the property location.'),
    locality: z.string().optional().describe('Locality of the property.'),
    city: z.string().describe('City of the property.'),
    state: z.string().describe('State of the property.'),
  }).describe('Location details of the property.'),
  // Other fields from the full listing schema, not directly used for estimation but passed through.
  title: z.string().optional().describe('Title of the property listing.'),
  description: z.string().optional().describe('Description of the property listing.'),
  media: z.object({
    coverUrl: z.string().optional().describe('URL of the cover image.'),
    urls: z.array(z.string()).optional().describe('URLs of all images.').optional()
  }).optional().describe('Media details of the property.'),
  createdAt: z.string().optional().describe('Timestamp when the property was created.'),
  updatedAt: z.string().optional().describe('Timestamp when the property was last updated.'),
  denormalizedStats: z.object({
    views7d: z.number().optional().describe('Views in last 7 days.'),
    views30d: z.number().optional().describe('Views in last 30 days.'),
    saves7d: z.number().optional().describe('Saves in last 7 days.'),
    trendingScore: z.number().optional().describe('Trending score.'),
  }).optional().describe('Denormalized statistics.'),
});

export type AiBestValueInput = z.infer<typeof PropertyDetailsForEstimationSchema>[];

// Schema for the output of the estimatePrice tool (mocked Cloud Function)
const EstimatePriceToolOutputSchema = z.object({
  predictedPrice: z.number().describe('The AI-predicted price or rent for the property.'),
  confidenceBand: z.object({
    min: z.number().describe('Lower bound of the confidence band.'),
    max: z.number().describe('Upper bound of the confidence band.'),
  }).describe('The confidence range for the predicted price.'),
  confidenceScore: z.number().describe('A score indicating the confidence of the prediction (0-1).'),
  topFactors: z.array(z.string()).describe('List of top factors influencing the prediction.').optional(),
});

// Define a Genkit tool to simulate calling the `estimatePrice` Cloud Function.
// In a real application, this would make an HTTP request to the Cloud Function endpoint.
const estimatePriceTool = ai.defineTool(
  {
    name: 'estimatePrice',
    description: 'Estimates the price or rent of a property based on its details using an ML model.',
    // The input to the ML model should only contain features relevant for estimation.
    inputSchema: PropertyDetailsForEstimationSchema.omit([
      'id', 'title', 'description', 'media', 'createdAt', 'updatedAt', 'denormalizedStats', 'geohash'
    ]),
    outputSchema: EstimatePriceToolOutputSchema,
  },
  async (propertyDetails) => {
    // This is a placeholder implementation.
    // In a real application, this function would make an HTTP request to the actual
    // Firebase Cloud Function for `estimatePrice`.
    // Example:
    // const response = await fetch('YOUR_CLOUD_FUNCTION_URL/estimatePrice', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(propertyDetails),
    // });
    // if (!response.ok) {
    //   throw new Error(`Cloud Function error: ${response.statusText}`);
    // }
    // return response.json();

    const listedPrice = propertyDetails.mode === 'sale' ? propertyDetails.price : propertyDetails.rentMonthly;
    if (listedPrice === undefined) {
      // This should ideally not happen if input validation is robust, but defensive check.
      throw new Error('Listed price or rent is required for AI estimation.');
    }

    // Simulate AI estimation by generating a predicted price slightly off the listed price.
    // This allows for varied "best value" scores for testing/demonstration.
    const varianceFactor = (Math.random() - 0.5) * 0.3; // -0.15 to +0.15
    const predictedPrice = listedPrice * (1 + varianceFactor);

    return {
      predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      confidenceBand: {
        min: parseFloat((predictedPrice * 0.9).toFixed(2)),
        max: parseFloat((predictedPrice * 1.1).toFixed(2)),
      },
      confidenceScore: 0.85,
      topFactors: ['areaSqft', 'location', 'bedrooms', 'type'],
    };
  }
);

// Schema for a property with its estimated price and calculated best value score.
const PropertyWithBestValueSchema = PropertyDetailsForEstimationSchema.extend({
  estimatedPrice: z.number().optional().describe('The AI-predicted price or rent for the property.'),
  bestValueScore: z.number().optional().describe('A score indicating how undervalued or overvalued the property is. Calculated as (estimatedPrice - listedPrice) / listedPrice. A higher positive score means more undervalued.'),
});
export type PropertyWithBestValue = z.infer<typeof PropertyWithBestValueSchema>;

// Output schema for the entire flow.
export type AiBestValueOutput = z.infer<typeof PropertyWithBestValueSchema>[];

const aiBestValueSortingFlow = ai.defineFlow(
  {
    name: 'aiBestValueSortingFlow',
    inputSchema: z.array(PropertyDetailsForEstimationSchema), // Array of properties to sort
    outputSchema: z.array(PropertyWithBestValueSchema),     // Array of properties with scores, sorted
  },
  async (inputListings) => {
    const propertiesWithScores: PropertyWithBestValue[] = [];

    // Process each listing to get an AI estimate and calculate the best value score.
    for (const listing of inputListings) {
      const listedPrice = listing.mode === 'sale' ? listing.price : listing.rentMonthly;

      // Ensure a listed price/rent is available to calculate best value.
      if (listedPrice === undefined) {
        console.warn(`Listing ${listing.id} skipped for AI Best Value: No listed price or rent available.`);
        propertiesWithScores.push({ ...listing, estimatedPrice: undefined, bestValueScore: undefined });
        continue;
      }

      try {
        // Prepare input for the estimatePrice tool, omitting fields not used by the ML model.
        const estimationInput = {
          mode: listing.mode,
          type: listing.type,
          price: listing.price,       // Pass listed price to tool, although model might not use it directly.
          rentMonthly: listing.rentMonthly, // Pass listed rent to tool.
          areaSqft: listing.areaSqft,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          furnishing: listing.furnishing,
          parking: listing.parking,
          floor: listing.floor,
          ageYears: listing.ageYears,
          facing: listing.facing,
          amenities: listing.amenities,
          location: listing.location,
        };

        const { predictedPrice } = await estimatePriceTool(estimationInput);

        // Calculate "Best Value" score: (estimated price - listed price) / listed price
        // A positive score means undervalued, negative means overvalued.
        const bestValueScore = (predictedPrice - listedPrice) / listedPrice;

        propertiesWithScores.push({
          ...listing,
          estimatedPrice: predictedPrice,
          bestValueScore: bestValueScore,
        });
      } catch (error) {
        console.error(`Failed to estimate price for listing ${listing.id}:`, error);
        // If estimation fails, add the listing without scores, or handle as per UX requirements.
        propertiesWithScores.push({ ...listing, estimatedPrice: undefined, bestValueScore: undefined });
      }
    }

    // Sort the properties by bestValueScore in descending order (most undervalued first).
    // Properties with undefined scores (due to errors or missing listed prices) will be placed at the end.
    propertiesWithScores.sort((a, b) => {
      if (a.bestValueScore === undefined && b.bestValueScore === undefined) return 0;
      if (a.bestValueScore === undefined) return 1; // 'a' (undefined) comes after 'b'
      if (b.bestValueScore === undefined) return -1; // 'b' (undefined) comes after 'a'
      return b.bestValueScore - a.bestValueScore; // Descending order
    });

    return propertiesWithScores;
  }
);

/**
 * Sorts a list of property listings by their "AI Best Value".
 * The "AI Best Value" is determined by comparing the AI-estimated price/rent
 * with the property's listed price/rent. Properties with a higher positive
 * "best value" score (meaning more undervalued by the AI) are listed first.
 *
 * @param input An array of property listings to be sorted.
 * @returns A Promise that resolves to an array of property listings,
 *          sorted by their "AI Best Value" in descending order.
 */
export async function sortPropertiesByAiBestValue(input: AiBestValueInput): Promise<AiBestValueOutput> {
  return aiBestValueSortingFlow(input);
}
