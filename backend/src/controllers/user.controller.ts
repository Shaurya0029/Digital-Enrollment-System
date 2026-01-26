import { Request, Response } from "express";
import { prisma } from "../prisma";

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
};
