# encoding: UTF-8

require "json"

module MobiViewExporter

  module ProjectWriter

    extend self

    def build(model, pieces)

      {
        name: model.title,
        guid: model.guid,
        path: model.path,
        exported_at: Time.now.strftime("%Y-%m-%d %H:%M:%S"),

        statistics: {
          total_pieces: pieces.size
        }
      }

    end

    def write(model, pieces, folder)

      file = File.join(folder, "project.json")

      File.open(file, "w:utf-8") do |f|
        f.write(JSON.pretty_generate(build(model, pieces)))
      end

      file

    end

  end

end