import nodemailer from 'nodemailer';

// Configure the SMTP transporter
// Note to User: You will need to fill in these environment variables in backend/.env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // e.g., Gmail App Password
    },
});

export const sendAccessRequestEmail = async (userEmail: string, userName: string) => {
    const adminEmail = 'markmallan01@gmail.com';

    // If SMTP credentials aren't set, just log it (prevents crashes during development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`[NOT SENT] Email notification for ${userEmail}. SMTP credentials missing.`);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"MFL LABS Security" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: '🚨 New Workspace Access Request - MFL LABS',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #0066FF;">New Access Request</h2>
                    <p>A new user has requested access to the MFL LABS platform.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${userName}</p>
                        <p style="margin: 0;"><strong>Email:</strong> ${userEmail}</p>
                    </div>
                    <p>Please log in to the <a href="${process.env.FRONTEND_URL || 'https://mfl-labs.vercel.app'}/admin" style="color: #0066FF; text-decoration: none; font-weight: bold;">Admin Control Panel</a> to assign them to a workspace and approve their request.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #888; font-size: 12px;">This is an automated message from MFL LABS System.</p>
                </div>
            `,
        });
        console.log(`Access request email successfully sent to admin for ${userEmail}`);
    } catch (error) {
        console.error('Failed to send access request email:', error);
    }
};
