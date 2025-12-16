import { api } from './api';

export interface SendTipInput {
  streamId: string;
  amountUsdc: string;
  signature: string;
  message: string;
  txHash: string;
}

export interface Tip {
  id: string;
  stream_id: string;
  viewer_id: string;
  amount_usdc: string;
  tx_hash: string | null;
  created_at: string;
}

export interface TipResponse extends Tip {
  viewer?: {
    id: string;
    wallet_address: string;
    display_name: string | null;
  };
}

export interface TipsListResponse {
  tips: TipResponse[];
}

export const tipService = {
  async sendTip(data: SendTipInput): Promise<TipResponse> {
    // Create a separate API instance without auth for viewer tips
    // Backend should handle viewer authentication via signature
    const response = await api.post<TipResponse>('/tips/send', data);
    return response.data;
  },

  async getTipsByStream(streamId: string): Promise<TipResponse[]> {
    // TODO: Backend needs to implement GET /tips/stream/:streamId
    // For now, return empty array
    try {
      const response = await api.get<TipsListResponse>(`/tips/stream/${streamId}`);
      return response.data.tips || [];
    } catch (error) {
      console.error('Failed to fetch tips:', error);
      return [];
    }
  },
};
