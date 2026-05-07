export default async (req: any, res: any) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'NestJS API is running on Vercel'
  });
};
