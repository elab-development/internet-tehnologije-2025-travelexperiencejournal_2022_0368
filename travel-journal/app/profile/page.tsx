import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { User, Post } from '@/lib/types';
import ProfileForm from '@/components/profile/ProfileForm';
import Card from '@/components/ui/Card';
import { Mail, Calendar, Shield } from 'lucide-react';

async function getUserData(userId: string): Promise<User | null> {
  const doc = await adminDb.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  return {
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate(),
    updatedAt: doc.data()?.updatedAt?.toDate(),
  } as User;
}

async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const snapshot = await adminDb
      .collection('posts')
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20) // ← DODAJ LIMIT!
      .get();

    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        postId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        travelDate: data.travelDate?.toDate(),
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect('/login');
  }

  const userData = await getUserData(session.user.id);
  const userPosts = await getUserPosts(session.user.id);

  if (!userData) {
    redirect('/login');
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Moj profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leva kolona - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profilna kartica */}
          <Card>
            <div className="text-center">
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {userData.displayName.charAt(0).toUpperCase()}
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {userData.displayName}
              </h2>

              {/* Email */}
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{userData.email}</span>
              </div>

              {/* Role badge */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {userData.role.toUpperCase()}
                </span>
              </div>

              {/* Datum registracije */}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Član od {formatDate(userData.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* Statistika */}
          <Card title="Statistika">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ukupno putopisa:</span>
                <span className="font-semibold text-gray-900">
                  {userPosts.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Objavljeno:</span>
                <span className="font-semibold text-gray-900">
                  {userPosts.filter((p) => p.isPublished).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Draft:</span>
                <span className="font-semibold text-gray-900">
                  {userPosts.filter((p) => !p.isPublished).length}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Desna kolona - Edit forma */}
        <div className="lg:col-span-2">
          <Card title="Uredi profil" subtitle="Ažuriraj svoje informacije">
            <ProfileForm user={userData} />
          </Card>
        </div>
      </div>

      {/* Lista korisnikovih putopisa */}
      {userPosts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Moji putopisi
          </h2>
          <div className="space-y-4">
            {userPosts.map((post) => (
              <Card key={post.postId} hoverable>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.isPublished ? 'Objavljeno' : 'Draft'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}