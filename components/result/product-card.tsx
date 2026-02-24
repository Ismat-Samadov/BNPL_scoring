'use client';

import { motion } from 'framer-motion';
import { Package, Star } from 'lucide-react';
import type { ProductRecommendation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface Props {
  product: ProductRecommendation;
}

export default function ProductCard({ product }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="rounded-2xl border border-[#6366f1]/30 bg-[#6366f1]/5 p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1]/15">
          <Package className="h-5 w-5 text-[#6366f1]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{product.product_info.name}</p>
            <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
          </div>
          <p className="text-xs text-muted-foreground">{product.product_info.description}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Base Limit</p>
          <p className="font-semibold">{product.product_info.base_limit.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Base Tenor</p>
          <p className="font-semibold">{product.product_info.base_tenor_months} months</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Alternative Products</p>
        <div className="flex flex-wrap gap-2">
          {product.top_3.map((p, i) => (
            <Badge
              key={p}
              variant={i === 0 ? 'default' : 'secondary'}
              className={i === 0 ? 'bg-[#6366f1] text-white' : ''}
            >
              {p.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
