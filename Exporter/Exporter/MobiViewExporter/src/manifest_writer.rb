# encoding: UTF-8

require "json"

module MobiViewExporter

  module ManifestWriter

    extend self

    VERSION = "1.0.0"

    def build(model)

      {
        format: "mobiview-project",

        version: VERSION,

        exporter: {
          name: "MobiView Exporter",
          version: MobiViewExporter::VERSION
        },

        project: {
          name: model.title,
          guid: model.guid
        },

        files: {
          project: "project.json",
          pieces: "pieces.json",
          modules: "modules.json",
          materials: "materials.json",
          views: "views.json",
          model: "model.glb",
          preview: "preview.png",
          thumbnail: "thumbnail.webp"
        },

        created_at: Time.now.strftime("%Y-%m-%d %H:%M:%S")
      }

    end

    def write(model, folder)

      file = File.join(folder, "manifest.json")

      File.open(file, "w:utf-8") do |f|
        f.write(JSON.pretty_generate(build(model)))
      end

      file

    end

  end

end
