import Editor from '@/components/Editor'
import FileList from '@/components/FileList'

export function Home() {
  return (
    <main className="flex">
      <FileList className="min-w-192px w-1/4" />
      <Editor className="flex-1" />
    </main>
  )
}
