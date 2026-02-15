import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/_core/hooks/useAuth";

export function LoginContainer() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { refresh } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
        const payload = isRegistering ? { name, email, password } : { email, password };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            if (isRegistering) {
                // After registration, auto-login or switch to login mode
                setIsRegistering(false);
                setError("Account created! Please sign in.");
            } else {
                // Success
                await refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50/50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Iniciar sesión
                    </CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tus credenciales para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan@odsenergy.net"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Cargando..." : "Entrar"}
                        </Button>
                    </form>

                    <div className="grid gap-4">
                        <Button variant="outline" className="w-full" type="button" disabled>
                            Iniciar con Google (Próximamente)
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="w-full text-center text-xs text-slate-400">
                        Acceso restringido a personal autorizado.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
